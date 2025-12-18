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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { useTenant } from '@/contexts/tenant-context';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { FileText, LoaderCircle } from 'lucide-react';
import { JobPackTemplate } from '@/lib/data';

interface CreateTemplateDialogProps {
  children?: React.ReactNode;
}

export function CreateTemplateDialog({ children }: CreateTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [setupType, setSetupType] = useState<'Stop-Go' | 'Lane Shift' | 'Shoulder' | 'Mobiles' | 'Other'>('Stop-Go');
  const [otherSetupType, setOtherSetupType] = useState('');
  const [startTime, setStartTime] = useState('');
  const [siteSetupTime, setSiteSetupTime] = useState('');

  const { toast } = useToast();
  const firestore = useFirestore();
  const { tenantId } = useTenant();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantId || !firestore) {
      toast({
        title: 'Error',
        description: 'Unable to determine your organization. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a template name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const templatesCollection = collection(firestore, 'job_pack_templates');
      const newTemplate: Omit<JobPackTemplate, 'id'> = {
        tenantId,
        name: name.trim(),
        description: description.trim(),
        setupType,
        ...(setupType === 'Other' && otherSetupType && { otherSetupType }),
        ...(startTime && { startTime }),
        ...(siteSetupTime && { siteSetupTime }),
        createdAt: Timestamp.now(),
      };

      await addDoc(templatesCollection, newTemplate);

      toast({
        title: 'Template Created',
        description: `Template "${name}" has been created successfully.`,
      });

      // Reset form
      setName('');
      setDescription('');
      setSetupType('Stop-Go');
      setOtherSetupType('');
      setStartTime('');
      setSiteSetupTime('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Could not create template.',
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
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Job Pack Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for job pack creation. Templates help speed up job creation by saving common configurations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g. Standard Stop-Go Setup"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                placeholder="Describe this template and when to use it..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-setup-type">Setup Type</Label>
              <Select
                value={setupType}
                onValueChange={(value: any) => setSetupType(value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="template-setup-type">
                  <SelectValue placeholder="Select setup type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stop-Go">Stop-Go</SelectItem>
                  <SelectItem value="Lane Shift">Lane Shift</SelectItem>
                  <SelectItem value="Shoulder">Shoulder</SelectItem>
                  <SelectItem value="Mobiles">Mobiles</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {setupType === 'Other' && (
              <div className="space-y-2">
                <Label htmlFor="other-setup-type">Specify Other Setup Type</Label>
                <Input
                  id="other-setup-type"
                  placeholder="Enter custom setup type"
                  value={otherSetupType}
                  onChange={(e) => setOtherSetupType(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-site-setup">On Site (Optional)</Label>
                <Input
                  id="template-site-setup"
                  placeholder="e.g. 19:00"
                  value={siteSetupTime}
                  onChange={(e) => setSiteSetupTime(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-start-time">Start Time (Optional)</Label>
                <Input
                  id="template-start-time"
                  placeholder="e.g. 20:00"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
