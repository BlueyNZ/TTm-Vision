
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
import { ExternalLink, Info, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().min(1, "Email is required."),
  role: z.enum(["TC", "STMS", "Operator", "Owner"]),
  accessLevel: z.enum(["Staff Member", "Admin", "Client"]),
});


export default function CreateStaffPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (!firestore) return;
        setIsSubmitting(true);
        
        const staffPayload = {
            name: data.name,
            email: data.email,
            role: data.role,
            certifications: [],
            licenses: [],
            emergencyContact: {
                name: "",
                phone: "",
            },
            accessLevel: data.accessLevel,
        };

        try {
            const staffCollectionRef = collection(firestore, 'staff');
            await addDoc(staffCollectionRef, staffPayload);
            
            toast({
                title: "Staff Profile Created",
                description: `A profile for ${data.name} has been created. They can now log in with the credentials you set in the Firebase Console.`,
            });
            
            router.push('/staff');

        } catch (error) {
             toast({
                title: "Error Creating Profile",
                description: "Something went wrong. Please try again.",
                variant: 'destructive',
            });
            console.error("Error adding document: ", error);
        } finally {
            setIsSubmitting(false);
        }
    }


    return (
        <div className='space-y-6'>
             <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Two-Step Process</AlertTitle>
                <AlertDescription>
                   <p className='mb-2'>To create a new staff or client account, you must first create the user in Firebase Authentication and then create their profile here.</p>
                   <ol className="list-decimal list-inside space-y-1">
                        <li>
                            <strong>Create Firebase User:</strong> Go to the Firebase Console, add a new user with their email and a temporary password.
                            <a href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/authentication/users`} target="_blank" rel="noopener noreferrer" className="ml-2">
                                <Button variant="outline" size="sm">
                                    Go to Firebase Console <ExternalLink className="ml-2 h-3 w-3"/>
                                </Button>
                            </a>
                        </li>
                        <li><strong>Create Profile:</strong> Fill out and submit the form below using the exact same email address.</li>
                   </ol>
                </AlertDescription>
            </Alert>
            <Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Create Staff/Client Profile</CardTitle>
                            <CardDescription>
                                Enter the details for the new user. Ensure the email matches the one in Firebase Auth.
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
