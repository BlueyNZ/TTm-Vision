
'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
  
export default function ClientPendingApprovalPage() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                            <CheckCircle className="h-10 w-10 text-success" />
                        </div>
                        <CardTitle className="text-2xl">Registration Submitted</CardTitle>
                        <CardDescription>Thank you for creating an account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Your account is now pending approval by an administrator. You will be notified via email once your account is active and you can log in to the client portal.
                        </p>
                    </CardContent>
                    <CardFooter>
                         <Link href="/client-login" className="w-full text-sm font-semibold text-primary hover:underline">
                            &larr; Back to Login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
      </ThemeProvider>
    );
}
