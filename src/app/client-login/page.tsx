'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { LoaderCircle, Building2, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeProvider } from '@/components/theme-provider';
import Link from 'next/link';

export default function ClientLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth) {
      toast({
        title: 'Error',
        description: 'Authentication service not available',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Store the user's choice in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('keepLoggedIn', JSON.stringify(keepLoggedIn));
      }
      
      // Set persistence for the current sign-in attempt
      const persistence = keepLoggedIn ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });

      router.push('/client/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Please check your credentials and try again.';
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }

      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          {/* Back to Staff Login */}
          <Link 
            href="/login" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Staff Login
          </Link>

          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mb-4 flex justify-center">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Client Portal</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="keep-logged-in"
                    checked={keepLoggedIn}
                    onCheckedChange={(checked) => setKeepLoggedIn(checked as boolean)}
                  />
                  <label
                    htmlFor="keep-logged-in"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Keep me logged in
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center space-y-2">
                <div className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/client-signup" className="font-semibold text-primary hover:underline">
                    Sign up
                  </Link>
                </div>
                <div className="text-sm text-muted-foreground">
                  Need help? <Link href="/support" className="text-primary hover:underline">Contact Support</Link>
                </div>
                <div className="text-sm text-muted-foreground">
                  <Link href="/" className="font-semibold text-primary hover:underline">
                    ← Back to home
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
}
