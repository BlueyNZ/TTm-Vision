'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BugAnalysisInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  stepsToReproduce: z.string().optional(),
  page: z.string(),
});

const BugAnalysisOutputSchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  severity: z.enum(['minor', 'moderate', 'major', 'critical']),
  detailQuality: z.enum(['poor', 'fair', 'good', 'excellent']),
  reasoning: z.string(),
  suggestedActions: z.array(z.string()).optional(),
});

type BugAnalysisInput = z.infer<typeof BugAnalysisInputSchema>;

export const analyzeBugReportFlow = ai.defineFlow(
  {
    name: 'analyzeBugReport',
    inputSchema: BugAnalysisInputSchema,
    outputSchema: BugAnalysisOutputSchema,
  },
  async (input: BugAnalysisInput) => {
    const prompt = `You are an expert bug triage assistant. Analyze the following bug report and determine its priority and severity.

**Bug Report:**
Title: ${input.title}
Description: ${input.description}
Steps to Reproduce: ${input.stepsToReproduce || 'Not provided'}
Page/Location: ${input.page}

**Analysis Criteria:**

1. **Severity Assessment:**
   - CRITICAL: System crashes, data loss, security vulnerabilities, complete feature failure
   - MAJOR: Significant functionality broken, workaround difficult, affects many users
   - MODERATE: Feature partially broken, workaround exists, affects some users
   - MINOR: Cosmetic issues, minor inconvenience, easy workaround

2. **Detail Quality Assessment:**
   - EXCELLENT: Clear title, detailed description, steps to reproduce provided, context given
   - GOOD: Clear description, most information provided, reproducible
   - FAIR: Basic description, some missing information, somewhat vague
   - POOR: Vague description, missing critical information, hard to understand

3. **Priority Assignment (combines severity + detail quality):**
   - CRITICAL: Critical severity issues regardless of detail
   - HIGH: Major severity with good+ detail, or critical issues with poor detail
   - MEDIUM: Moderate severity with good+ detail, or major issues with poor detail
   - LOW: Minor severity issues, or poorly detailed moderate issues

**Output Requirements:**
Provide a structured analysis with:
- Priority level (low/medium/high/critical)
- Severity level (minor/moderate/major/critical)
- Detail quality (poor/fair/good/excellent)
- Reasoning: 1-2 sentences explaining the priority assignment
- Suggested actions: 2-3 specific next steps for addressing this bug (optional)

Respond ONLY with valid JSON matching this schema:
{
  "priority": "low" | "medium" | "high" | "critical",
  "severity": "minor" | "moderate" | "major" | "critical",
  "detailQuality": "poor" | "fair" | "good" | "excellent",
  "reasoning": "string",
  "suggestedActions": ["action1", "action2"]
}`;

    const result = await ai.generate({
      model: 'googleai/gemini-pro',
      prompt,
      config: {
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxOutputTokens: 500,
      },
    });

    let analysis;
    try {
      // Try to parse the JSON response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      // Fallback if AI response isn't valid JSON
      console.error('Failed to parse AI response:', error);
      analysis = {
        priority: 'medium',
        severity: 'moderate',
        detailQuality: input.stepsToReproduce ? 'good' : 'fair',
        reasoning: 'Unable to analyze automatically. Manual review recommended.',
        suggestedActions: ['Review bug report details', 'Attempt to reproduce issue'],
      };
    }

    return analysis;
  }
);

// Helper function to call the flow from other parts of the app
export async function analyzeBugReport(bugData: {
  title: string;
  description: string;
  stepsToReproduce?: string;
  page: string;
}) {
  try {
    const result = await analyzeBugReportFlow(bugData);
    return result;
  } catch (error) {
    console.error('Error analyzing bug report:', error);
    // Return default analysis on error
    return {
      priority: 'medium' as const,
      severity: 'moderate' as const,
      detailQuality: bugData.stepsToReproduce ? 'good' as const : 'fair' as const,
      reasoning: 'Automatic analysis unavailable. Defaulting to medium priority.',
      suggestedActions: ['Manual review required'],
    };
  }
}
