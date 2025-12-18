'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Mail, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TestEmailDialogProps {
  children?: React.ReactNode;
}

export function TestEmailDialog({ children }: TestEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailType, setEmailType] = useState('password-reset');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const handleSendTestEmail = async () => {
    if (!auth || !email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      if (emailType === 'password-reset') {
        await sendPasswordResetEmail(auth, email, {
          url: `${window.location.origin}/login`,
        });
        setSuccess(true);
        toast({
          title: 'Test Email Sent!',
          description: `Password reset email sent to ${email}`,
        });
      } else if (emailType === 'email-verification') {
        // For email verification testing, we need to create a temporary account
        // or sign in as the user first
        toast({
          title: 'Info',
          description: 'Email verification requires creating/signing into the account first. Use Password Reset for general template testing.',
          variant: 'default',
        });
        setLoading(false);
        return;
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setEmail('');
        setSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test email',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            Test Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Test Email Service</DialogTitle>
          <DialogDescription>
            Send test emails to verify your email templates and Firebase configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-type">Email Type</Label>
            <Select value={emailType} onValueChange={setEmailType} disabled={loading}>
              <SelectTrigger id="email-type">
                <SelectValue placeholder="Select email type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="password-reset">Password Reset</SelectItem>
                <SelectItem value="email-verification">Email Verification</SelectItem>
              </SelectContent>
            </Select>
            {emailType === 'email-verification' && (
              <p className="text-xs text-muted-foreground">
                Note: This will send a verification email. The user must be signed in to verify.
              </p>
            )}
          </div>

          {success && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Test email sent successfully! Check your inbox.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSendTestEmail}
              disabled={loading || !email}
              className="flex-1"
            >
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
