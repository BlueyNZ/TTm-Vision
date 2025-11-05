
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, LoaderCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Staff } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const requestJobSchema = z.object({
  location: z.string().min(3, { message: "Please provide a location." }),
  startDate: z.date({
    required_error: "A start date is required.",
  }),
  startTime: z.string().min(1, { message: "Please provide a start time." }),
  description: z.string().min(10, { message: "Please provide a detailed description." }),
  setupType: z.enum(['Stop-Go', 'Lane Shift', 'Shoulder', 'Mobiles', 'Other'], {
      required_error: "Please select a setup type."
  }),
  otherSetupType: z.string().optional(),
}).refine(data => {
    if (data.setupType === 'Other') {
        return !!data.otherSetupType && data.otherSetupType.length > 0;
    }
    return true;
}, {
    message: "Please specify the setup type.",
    path: ['otherSetupType']
});

export default function RequestJobPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the current user's staff profile to get their client name
  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return collection(firestore, 'staff');
  }, [firestore, user?.email]);

  const { data: staffData } = useCollection<Staff>(staffQuery);
  const currentUserStaffProfile = useMemo(() => staffData?.find(s => s.email === user?.email), [staffData, user?.email]);
  
  const form = useForm<z.infer<typeof requestJobSchema>>({
    resolver: zodResolver(requestJobSchema),
    defaultValues: {
        location: "",
        description: "",
        startTime: "",
    }
  });

  const setupType = form.watch('setupType');

  async function onSubmit(data: z.infer<typeof requestJobSchema>) {
    if (!firestore || !currentUserStaffProfile) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not identify client. Please log in again.'
        });
        return;
    };
    setIsSubmitting(true);

    const jobsCollectionRef = collection(firestore, 'job_packs');
    
    try {
        const jobSnapshot = await getDocs(jobsCollectionRef);
        const jobCount = jobSnapshot.size;
        const newJobNumber = `TF-${String(jobCount + 1).padStart(4, '0')}`;

        const newJobRequest = {
            jobNumber: newJobNumber,
            location: data.location,
            clientName: currentUserStaffProfile.name,
            clientId: currentUserStaffProfile.id, // Assuming staff ID can be client ID here
            name: data.description,
            startDate: Timestamp.fromDate(data.startDate),
            startTime: data.startTime,
            setupType: data.setupType,
            otherSetupType: data.otherSetupType || '',
            siteSetupTime: '',
            status: 'Pending',
            stms: null,
            stmsId: null,
            tcs: [],
        };
        
        await addDoc(jobsCollectionRef, newJobRequest);
        
        toast({
            title: 'Job Request Submitted',
            description: `Your request for ${data.location} has been received and is now pending review.`,
        });

        router.push('/client/dashboard');

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Error Submitting Request',
            description: 'Something went wrong. Please try again.',
        });
        console.error("Error submitting job request: ", error);
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request a New Job</CardTitle>
          <CardDescription>
            Fill out the form below to request a new traffic management job. We will review it and be in touch shortly.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Job Location</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 123 Main St, Auckland" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Requested Start Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                    date < new Date()
                                    }
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Requested Start Time</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 9:00 AM" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="setupType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Setup Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select the type of setup required" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Stop-Go">Stop-Go</SelectItem>
                                    <SelectItem value="Lane Shift">Lane Shift</SelectItem>
                                    <SelectItem value="Shoulder">Shoulder Work</SelectItem>
                                    <SelectItem value="Mobiles">Mobile Operations</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    {setupType === 'Other' && (
                        <FormField
                            control={form.control}
                            name="otherSetupType"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Please Specify Setup</FormLabel>
                                <FormControl>
                                    <Input placeholder="Describe the custom setup" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Job Description & Requirements</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Please describe the work required, any specific access needs, and the duration of the job..." 
                                    className="min-h-[150px]"
                                    {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
                 <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  );
}
