
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Building, LoaderCircle } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  companyName: z.string().min(2, 'Company name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export default function ClientSignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      companyName: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof signupSchema>) {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Registration Error',
        description: 'Services are not ready. Please try again later.',
      });
      return;
    }
    setIsLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Create client company document with "Pending" status
      const clientCollectionRef = collection(firestore, 'clients');
      const clientDocRef = await addDoc(clientCollectionRef, {
        name: data.companyName,
        userId: user.uid,
        status: 'Pending', // New companies start as pending
      });

      // 3. Create staff profile with 'Client' access level
      const staffCollectionRef = collection(firestore, 'staff');
      await addDoc(staffCollectionRef, {
        name: data.fullName,
        email: data.email,
        phone: '', // Can be updated by user later
        role: 'Operator', // Default role, clients don't have a staff role
        certifications: [],
        licenses: [],
        emergencyContact: {
          name: '',
          phone: '',
        },
        accessLevel: 'Client',
      });
      
      toast({
        title: 'Registration Submitted!',
        description: 'Your account is pending approval by an administrator. You will be notified once it is active.',
        duration: 8000,
      });

      router.push('/client-login');

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.code === 'auth/email-already-in-use' 
          ? 'This email is already registered.' 
          : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Building className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Create Client Account</CardTitle>
                <CardDescription>
                  Register your company to start managing your traffic management jobs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Company Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Register
                </Button>
                <div className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/client-login" className="font-semibold text-primary hover:underline">
                    Log in
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </ThemeProvider>
  );
}
