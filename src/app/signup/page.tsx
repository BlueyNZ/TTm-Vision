
'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
  
export default function SignupPage() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                        <LifeBuoy className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle className="text-2xl">Account Creation</CardTitle>
                            <CardDescription>How to get access to TTM Vision.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        To ensure security and proper access control, user accounts for TTM Vision must be created by an administrator.
                    </p>
                    <p className="text-muted-foreground">
                        Please contact your designated company administrator or manager. They will be able to create an account for you and provide you with your login credentials.
                    </p>
                    <div className="pt-2">
                        <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
                            &larr; Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
            </div>
      </ThemeProvider>
    );
}
