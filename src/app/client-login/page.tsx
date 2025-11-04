
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building, LoaderCircle } from 'lucide-react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function ClientLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('keepLoggedIn', JSON.stringify(keepLoggedIn));
      }
      
      const persistence = keepLoggedIn ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      await signInWithEmailAndPassword(auth, email, password);
      
      toast({
        title: 'Login Successful',
        description: "Welcome to the Client Portal!",
      });
      router.push('/client/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Building className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Client Portal</CardTitle>
            <CardDescription>Log in to view your job details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                 <p className="text-xs text-muted-foreground px-1">
                  Use a strong, unique password to keep your account secure.
                </p>
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
             <div className="text-sm text-muted-foreground">
              Are you staff?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Staff Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </ThemeProvider>
  );
}
