'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { LoaderCircle, Building2, ArrowLeft, CheckCircle } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';
import Link from 'next/link';

export default function CompanySignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    managerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth || !firestore) {
      toast({
        title: 'Error',
        description: 'Service not available',
        variant: 'destructive',
      });
      return;
    }

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: formData.managerName,
      });

      // Create tenant document
      const tenantId = formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await setDoc(doc(firestore, 'tenants', tenantId), {
        id: tenantId,
        name: formData.companyName,
        status: 'Active',
        createdAt: Timestamp.now(),
        settings: {
          contactEmail: formData.email,
          contactPhone: formData.phone,
        }
      });

      // Create staff document for the manager
      await setDoc(doc(firestore, 'staff', userCredential.user.uid), {
        tenantId: tenantId,
        name: formData.managerName,
        email: formData.email,
        phone: formData.phone,
        role: 'Owner',
        certifications: [],
        licenses: [],
        emergencyContact: {
          name: '',
          phone: '',
        },
        accessLevel: 5, // Admin level (highest access)
        createdAt: Timestamp.now(),
      });

      // Set custom claims with tenantId
      try {
        const idToken = await userCredential.user.getIdToken();
        await fetch('/api/auth/set-claims', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });
        // Force token refresh to get new claims
        await userCredential.user.getIdToken(true);
      } catch (claimsError) {
        console.error('Error setting custom claims:', claimsError);
        // Continue anyway - claims will be set on next login
      }

      setIsSubmitted(true);
      
      toast({
        title: 'Account Created!',
        description: 'Your company has been registered successfully.',
      });

      // Wait a moment then redirect to login
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-green-500/10 p-3">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">Company Created!</h2>
                  <p className="text-muted-foreground">
                    Your TTM company account has been created successfully.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can now log in and start inviting your staff members.
                  </p>
                </div>
                <Button onClick={() => router.push('/login')} className="mt-4">
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>

          <Card>
            <CardHeader className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-orange-500/10 p-3">
                  <Building2 className="h-12 w-12 text-orange-500" />
                </div>
              </div>
              <CardTitle className="text-2xl">Create TTM Company Account</CardTitle>
              <CardDescription>
                Register your traffic management company and become the account administrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="ABC Traffic Management Ltd"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerName">Your Full Name *</Label>
                  <Input
                    id="managerName"
                    type="text"
                    placeholder="John Smith"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="manager@yourcompany.co.nz"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+64 21 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium mb-2">What happens next:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>✓ Your company account will be created</li>
                    <li>✓ You'll become the account administrator</li>
                    <li>✓ You can invite and manage your staff</li>
                    <li>✓ Full access to all TTM Vision features</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Company Account'
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
}
