
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoaderCircle, KeyRound, AlertTriangle } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';

const setPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

function CompleteSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!auth || !oobCode) {
        setError('Invalid or missing authentication code.');
        setIsLoading(false);
        return;
    };
    
    verifyPasswordResetCode(auth, oobCode)
        .then(() => {
            setIsValidCode(true);
        })
        .catch(err => {
            setError('This link is invalid or has expired. Please request a new one.');
            console.error(err);
        })
        .finally(() => {
            setIsLoading(false);
        });

  }, [auth, oobCode]);


  const form = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: z.infer<typeof setPasswordSchema>) {
    if (!auth || !oobCode) return;
    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      toast({
        title: 'Account Activated!',
        description: 'Your password has been set. You can now log in.',
      });
      router.push('/client-login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Set Password',
        description: error.message || 'An unexpected error occurred.',
      });
      setIsLoading(false);
    }
  }

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
                <p>Verifying invitation...</p>
            </div>
        );
    }

    if (error) {
         return (
            <div className="flex flex-col items-center justify-center gap-4 text-destructive">
                <AlertTriangle className="h-10 w-10" />
                <p className='text-center'>{error}</p>
            </div>
        );
    }
    
    if (isValidCode) {
        return (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader className="text-center">
                 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <KeyRound className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Complete Your Account</CardTitle>
                <CardDescription>
                  Welcome! Please create a secure password to activate your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Set Password & Activate
                </Button>
              </CardFooter>
            </form>
          </Form>
        );
    }

    return null; // Should not be reached
  }


  return (
     <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                {renderContent()}
            </Card>
        </div>
    </ThemeProvider>
  )
}

export default function CompleteSignupPage() {
    return (
        <Suspense fallback={<LoaderCircle className="h-10 w-10 animate-spin text-primary"/>}>
            <CompleteSignupContent/>
        </Suspense>
    )
}
