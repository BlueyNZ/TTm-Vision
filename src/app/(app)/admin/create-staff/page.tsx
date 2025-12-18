'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { CheckCircle, LoaderCircle, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser } from '@/firebase';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendPasswordResetEmail } from 'firebase/auth';

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["TC", "STMS", "Operator", "Owner", "Tester"]),
  accessLevel: z.enum(["Staff Member", "Management", "Admin", "Client"]),
});

export default function CreateStaffPage() {
    const { toast } = useToast();
    const auth = useAuth();
    const { user: currentUser } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdEmail, setCreatedEmail] = useState<string>('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

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
        if (!currentUser) {
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
            const token = await currentUser.getIdToken();

            // Call the API route to create the user
            const response = await fetch('/api/admin/create-staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

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

            // User created successfully, now send Firebase's built-in password reset email
            setCreatedEmail(data.email);
            setShowSuccess(true);
            
            // Send Firebase's automatic email
            if (auth) {
                try {
                    setSendingEmail(true);
                    await sendPasswordResetEmail(auth, data.email);
                    console.log('✅ Firebase password reset email sent to:', data.email);
                    
                    toast({
                        title: "Success!",
                        description: "Staff member created and password setup email sent.",
                    });
                } catch (emailError: any) {
                    console.error('❌ Error sending Firebase email:', emailError);
                    toast({
                        title: "Staff Created",
                        description: "User created but email failed to send. Ask them to use 'Forgot Password'.",
                        variant: 'destructive',
                    });
                } finally {
                    setSendingEmail(false);
                }
            } else {
                toast({
                    title: "Staff Created",
                    description: "User created but auth service unavailable. Ask them to use 'Forgot Password'.",
                    variant: 'destructive',
                });
            }

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

    if (showSuccess) {
        return (
            <div className="container max-w-2xl py-10">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Staff Member Created
                        </CardTitle>
                        <CardDescription>
                            The account has been created successfully
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sendingEmail ? (
                            <Alert className="bg-blue-50 border-blue-200">
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                <AlertTitle>Sending Email...</AlertTitle>
                                <AlertDescription>
                                    Sending password setup email to {createdEmail}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert className="bg-green-50 border-green-200">
                                <Mail className="h-4 w-4" />
                                <AlertTitle>Email Sent!</AlertTitle>
                                <AlertDescription>
                                    A password setup email has been sent to <strong>{createdEmail}</strong> using Firebase's built-in email service.
                                    <br />
                                    <br />
                                    The email contains a link to set their password (valid for 1 hour).
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button onClick={() => setShowSuccess(false)} className="w-full">
                            Create Another Staff Member
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Staff Member</CardTitle>
                    <CardDescription>
                        Add a new staff member to your team. They will receive an email to set their password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
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
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="john@example.com" {...field} />
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
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="TC">Traffic Controller (TC)</SelectItem>
                                                <SelectItem value="STMS">Site Traffic Management Supervisor (STMS)</SelectItem>
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select access level" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Staff Member">Staff Member</SelectItem>
                                                <SelectItem value="Management">Management</SelectItem>
                                                <SelectItem value="Admin">Admin</SelectItem>
                                                <SelectItem value="Client">Client</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Staff Member'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
