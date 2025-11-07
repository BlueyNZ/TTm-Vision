'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { Job, Staff } from "@/lib/data";
import { doc, query, collection, where, Timestamp } from "firebase/firestore";
import { useParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMemo } from "react";
import { format } from 'date-fns';

const timesheetSchema = z.object({
  jobDate: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  finishTime: z.string().min(1, "Finish time is required"),
  breaks: z.string(),
  isStms: z.boolean(),
  isNightShift: z.boolean(),
  isMealAllowance: z.boolean(),
  isToolAllowance: z.boolean(),
  signature: z.boolean().refine(val => val === true, {
    message: "You must confirm the hours are correct.",
  }),
});


export default function SingleCrewTimesheetPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !jobId) return null;
    return doc(firestore, 'job_packs', jobId);
  }, [firestore, jobId]);

  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'staff'), where('email', '==', user.email));
  }, [firestore, user?.email]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: staffData, isLoading: isStaffLoading } = useCollection<Staff>(staffQuery);
  const currentStaffMember = useMemo(() => staffData?.[0], [staffData]);
  
  const form = useForm<z.infer<typeof timesheetSchema>>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      jobDate: job?.startDate instanceof Timestamp ? format(job.startDate.toDate(), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      startTime: '',
      finishTime: '',
      breaks: '30',
      isStms: false,
      isNightShift: false,
      isMealAllowance: false,
      isToolAllowance: false,
      signature: false,
    },
  });
  
  const isLoading = isJobLoading || isUserLoading || isStaffLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  function onSubmit(data: z.infer<typeof timesheetSchema>) {
    console.log(data);
    // Here you would submit the data to Firestore
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Single Crew Timesheet</CardTitle>
        <CardDescription>
          For Job: {job?.jobNumber || '...'} at {job?.location || '...'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Staff Member</Label>
                <Input value={currentStaffMember?.name} disabled />
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="jobDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="finishTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finish Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="breaks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breaks</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />
            
            <div>
                <Label>Allowances</Label>
                <div className="space-y-2 mt-2">
                    <FormField
                      control={form.control}
                      name="isStms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>STMS Allowance</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isNightShift"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Night Shift Allowance</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="isMealAllowance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Meal Allowance</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="isToolAllowance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Tool Allowance</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                </div>
            </div>

            <Separator />

            <FormField
              control={form.control}
              name="signature"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Signature
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      By checking this box, I confirm that the hours and allowances claimed are true and correct.
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

          </CardContent>
          <CardFooter>
            <Button type="submit">Submit Timesheet</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
