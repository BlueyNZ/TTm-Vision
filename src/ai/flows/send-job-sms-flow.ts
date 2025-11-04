
'use server';
/**
 * @fileOverview A Genkit flow for sending job details via SMS to assigned staff.
 *
 * - sendJobSms - A function that orchestrates fetching job/staff data and sending SMS.
 * - SendJobSmsInput - The input type for the sendJobSms function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Job, Staff } from '@/lib/data';
import { format } from 'date-fns';

export const SendJobSmsInputSchema = z.object({
  jobId: z.string().describe('The ID of the job pack to send notifications for.'),
});
export type SendJobSmsInput = z.infer<typeof SendJobSmsInputSchema>;

const sendSmsTool = ai.defineTool(
  {
    name: 'sendSms',
    description: 'Sends an SMS message to a given phone number.',
    inputSchema: z.object({
      to: z.string().describe('The recipient\'s phone number.'),
      body: z.string().describe('The content of the message.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (input) => {
    // This is a placeholder implementation.
    // In a real application, you would integrate with an SMS service like Twilio here.
    console.log(`## SIMULATING SENDING SMS ##
To: ${input.to}
Body: ${input.body}
###########################`);
    
    // For now, we'll just simulate a successful response.
    return {
      success: true,
      message: `SMS successfully simulated for ${input.to}`,
    };
  }
);

const sendJobSmsFlow = ai.defineFlow(
  {
    name: 'sendJobSmsFlow',
    inputSchema: SendJobSmsInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      messagesSent: z.number(),
      errors: z.array(z.string()),
    }),
  },
  async (input) => {
    const firestore = getFirestore();
    const { jobId } = input;
    let messagesSent = 0;
    const errors: string[] = [];

    // 1. Fetch Job Details
    const jobRef = doc(firestore, 'job_packs', jobId);
    const jobSnap = await getDoc(jobRef);

    if (!jobSnap.exists()) {
      throw new Error(`Job with ID ${jobId} not found.`);
    }
    const job = jobSnap.data() as Job;
    const jobDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);

    // 2. Get all unique staff IDs from the job
    const staffIds = new Set<string>();
    if (job.stmsId) {
      staffIds.add(job.stmsId);
    }
    job.tcs.forEach(tc => staffIds.add(tc.id));
    
    if (staffIds.size === 0) {
      return { success: true, messagesSent: 0, errors: ["No staff assigned to this job."] };
    }

    // 3. Fetch all staff profiles
    const staffPromises = Array.from(staffIds).map(id => getDoc(doc(firestore, 'staff', id)));
    const staffSnaps = await Promise.all(staffPromises);
    
    // 4. Construct and send SMS for each staff member
    for (const staffSnap of staffSnaps) {
      if (staffSnap.exists()) {
        const staff = staffSnap.data() as Staff;
        
        if (staff.phone) {
          const messageBody = `TTM Vision Job Update:
Role: ${job.stmsId === staff.id ? 'STMS' : 'TC'}
Location: ${job.location}
Date: ${format(jobDate, 'eeee, dd MMM yyyy')}
Setup Time: ${job.siteSetupTime}
Start Time: ${job.startTime}`;

          try {
            const result = await sendSmsTool({ to: staff.phone, body: messageBody });
            if (result.success) {
              messagesSent++;
            } else {
              errors.push(`Failed to send SMS to ${staff.name}: ${result.message}`);
            }
          } catch (e: any) {
            errors.push(`Error sending SMS to ${staff.name}: ${e.message}`);
          }

        } else {
          errors.push(`Skipping ${staff.name}: No phone number on file.`);
        }
      } else {
         errors.push(`Could not find profile for staff ID: ${staffSnap.id}`);
      }
    }

    return {
      success: errors.length === 0,
      messagesSent,
      errors,
    };
  }
);


export async function sendJobSms(input: SendJobSmsInput): Promise<{ success: boolean; messagesSent: number; errors: string[] }> {
  return sendJobSmsFlow(input);
}
