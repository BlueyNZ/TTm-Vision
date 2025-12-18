'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { useTenant } from '@/contexts/tenant-context';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Bug, LoaderCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { analyzeBugReport } from '@/ai/flows/analyze-bug-report-flow';

interface ReportBugDialogProps {
  children?: React.ReactNode;
}

export function ReportBugDialog({ children }: ReportBugDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const { tenantId, currentTenantName } = useTenant();
  const pathname = usePathname();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firestore) {
      toast({
        title: 'Error',
        description: 'Unable to submit bug report. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a title and description.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Analyze bug report with AI
      const aiAnalysis = await analyzeBugReport({
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim(),
        page: pathname || 'unknown',
      });

      const bugReportsCollection = collection(firestore, 'bug_reports');
      const bugReport = {
        title: title.trim(),
        description: description.trim(),
        stepsToReproduce: stepsToReproduce.trim() || null,
        reportedBy: {
          email: user?.email || 'anonymous',
          displayName: user?.displayName || 'Unknown User',
          uid: user?.uid || null,
        },
        tenantId: tenantId || null,
        tenantName: currentTenantName || null,
        page: pathname || 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : null,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        status: 'open',
        priority: aiAnalysis.priority,
        severity: aiAnalysis.severity,
        detailQuality: aiAnalysis.detailQuality,
        aiAnalysis: {
          reasoning: aiAnalysis.reasoning,
          suggestedActions: aiAnalysis.suggestedActions || [],
          analyzedAt: Timestamp.now(),
        },
        createdAt: Timestamp.now(),
      };

      await addDoc(bugReportsCollection, bugReport);

      toast({
        title: 'Bug Report Submitted',
        description: 'Thank you! Your bug report has been submitted successfully.',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setStepsToReproduce('');
      setOpen(false);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Could not submit bug report.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Bug className="mr-2 h-4 w-4" />
            Report Bug
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Report a Bug</DialogTitle>
            <DialogDescription>
              Found an issue? Let us know and we'll fix it as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bug-title">Bug Title</Label>
              <Input
                id="bug-title"
                placeholder="Brief summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bug-description">Description</Label>
              <Textarea
                id="bug-description"
                placeholder="Describe what happened and what you expected to happen..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bug-steps">Steps to Reproduce (Optional)</Label>
              <Textarea
                id="bug-steps"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
            <div className="rounded-md bg-muted p-3 text-xs space-y-1">
              <div className="font-medium text-muted-foreground">Automatically included:</div>
              <div className="text-muted-foreground">• Current page: {pathname}</div>
              <div className="text-muted-foreground">• User: {user?.email || 'Not logged in'}</div>
              {currentTenantName && (
                <div className="text-muted-foreground">• Company: {currentTenantName}</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
