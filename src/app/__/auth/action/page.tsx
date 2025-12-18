'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/firebase';
import { 
  verifyPasswordResetCode, 
  confirmPasswordReset,
  applyActionCode 
} from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoaderCircle, CheckCircle, XCircle } from 'lucide-react';

export default function AuthActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();

  const mode = searchParams?.get('mode');
  const oobCode = searchParams?.get('oobCode');
  const continueUrl = searchParams?.get('continueUrl');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!auth || !oobCode) {
      setError('Invalid request. Missing required parameters.');
      setLoading(false);
      return;
    }

    const handleAction = async () => {
      try {
        if (mode === 'resetPassword') {
          // Verify the password reset code and get the email
          const userEmail = await verifyPasswordResetCode(auth, oobCode);
          setEmail(userEmail);
          setLoading(false);
        } else if (mode === 'verifyEmail') {
          // Apply the email verification code
          await applyActionCode(auth, oobCode);
          setSuccess(true);
          setLoading(false);
        } else {
          setError('Invalid action mode.');
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Error handling auth action:', error);
        let errorMessage = 'An error occurred. The link may be invalid or expired.';
        
        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'This link has expired. Please request a new one.';
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'This link is invalid. Please request a new one.';
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    handleAction();
  }, [auth, mode, oobCode]);

  const handlePasswordReset = async () => {
    if (!auth || !oobCode) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => {
        router.push(continueUrl || '/login');
      }, 3000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError('Failed to reset password. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying your request...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'verifyEmail' && success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle>Email Verified!</CardTitle>
            </div>
            <CardDescription>
              Your email has been successfully verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push(continueUrl || '/login')}
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'resetPassword' && success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle>Password Reset Successful!</CardTitle>
            </div>
            <CardDescription>
              Your password has been updated. Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push(continueUrl || '/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'resetPassword') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              Enter a new password for {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={processing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={processing}
                />
              </div>
              <Button
                className="w-full"
                onClick={handlePasswordReset}
                disabled={processing || !newPassword || !confirmPassword}
              >
                {processing ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
