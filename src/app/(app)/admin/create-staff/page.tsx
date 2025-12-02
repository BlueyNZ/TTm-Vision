
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Copy, LoaderCircle, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["TC", "STMS", "Operator", "Owner", "Tester"]),
  accessLevel: z.enum(["Staff Member", "Admin", "Client"]),
});


export default function CreateStaffPage() {
    const { toast } = useToast();
    const auth = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resetLink, setResetLink] = useState<string>('');
    const [createdEmail, setCreatedEmail] = useState<string>('');
    const [showSuccess, setShowSuccess] = useState(false);

    const form = useForm<z.infer<typeof staffSchema>>({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            name: "",
            email: "",
            role: undefined,
            accessLevel: "Staff Member",
        }
    });

    async function onSubmit(data: z.infer<typeof staffSchema>) {
        if (!auth?.currentUser) {
            toast({
                title: "Authentication Required",
                description: "You must be logged in to create staff.",
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Get the current user's auth token
            const token = await auth.currentUser.getIdToken();

            // Call the API route
            const response = await fetch('/api/admin/create-staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned an invalid response. Check console for details.');
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create staff');
            }

            // Show success state with reset link
            setResetLink(result.resetLink);
            setCreatedEmail(data.email);
            setShowSuccess(true);
            form.reset();

        } catch (error: any) {
            toast({
                title: "Error Creating Staff",
                description: error.message || "Something went wrong. Please try again.",
                variant: 'destructive',
            });
            console.error("Error creating staff: ", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "Copied!",
                description: "Password reset link copied to clipboard.",
            });
        } catch (error) {
            toast({
                title: "Copy Failed",
                description: "Please manually copy the link.",
                variant: 'destructive',
            });
        }
    };

    const sendEmailLink = () => {
        const subject = encodeURIComponent('Set Your Password - TTm Vision');
        const body = encodeURIComponent(
            `Hello,\n\nYour account has been created for TTm Vision.\n\nPlease click the link below to set your password:\n\n${resetLink}\n\nThis link will expire in 24 hours.\n\nBest regards,\nTTm Vision Team`
        );
        window.open(`mailto:${createdEmail}?subject=${subject}&body=${body}`, '_blank');
    };

    if (showSuccess) {
        return (
            <div className='space-y-6'>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <CardTitle>Staff Created Successfully!</CardTitle>
                                <CardDescription>
                                    Account created for {createdEmail}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <Mail className="h-4 w-4" />
                            <AlertTitle>Send Password Reset Link</AlertTitle>
                            <AlertDescription className="space-y-3 mt-2">
                                <p>The user needs to set their password. Share this link with them:</p>
                                <div className="bg-muted p-3 rounded-md font-mono text-xs break-all">
                                    {resetLink}
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => copyToClipboard(resetLink)}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy Link
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={sendEmailLink}
                                    >
                                        <Mail className="mr-2 h-4 w-4" />
                                        Open Email Client
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    This link is valid for 24 hours. After setting their password, they can log in at the login page.
                                </p>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button onClick={() => setShowSuccess(false)}>
                            Create Another Staff Member
                        </Button>
                        <Button variant="outline" onClick={() => router.push('/staff')}>
                            Go to Staff List
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }


    return (
        <div className='space-y-6'>
            <Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Create Staff/Client Profile</CardTitle>
                            <CardDescription>
                                This will automatically create a Firebase Auth account and send a password reset link to the user.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
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
                                    <Input placeholder="user@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Job Title/Role</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="TC">Traffic Controller (TC)</SelectItem>
                                    <SelectItem value="STMS">STMS</SelectItem>
                                    <SelectItem value="Operator">Operator</SelectItem>
                                    <SelectItem value="Owner">Owner</SelectItem>
                                    <SelectItem value="Tester">Tester</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="accessLevel"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Access Level</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an access level" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="Staff Member">Staff Member</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Client">Client</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Create Profile
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
