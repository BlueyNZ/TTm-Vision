'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { LoaderCircle } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/firebase";

const addStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
});

type AddClientStaffDialogProps = {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddClientStaffDialog({ clientId, clientName, open, onOpenChange }: AddClientStaffDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof addStaffSchema>>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: { name: "", email: "" },
  });

  async function onSubmit(data: z.infer<typeof addStaffSchema>) {
    if (!firestore || !auth) return;
    setIsSubmitting(true);
    
    try {
      // 1. Create the staff document in Firestore
      const staffCollectionRef = collection(firestore, 'staff');
      await addDoc(staffCollectionRef, {
          name: data.name,
          email: data.email,
          clientId: clientId,
          accessLevel: 'Client Staff',
          role: 'Operator', // Default role
          createdAt: serverTimestamp(),
      });

      // 2. Send the password creation/reset email
      const actionCodeSettings = {
        url: `${window.location.origin}/complete-signup`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, data.email, actionCodeSettings);

      toast({
        title: "Invitation Sent",
        description: `${data.name} has been sent an email to set up their account.`,
      });

      form.reset();
      onOpenChange(false);
    } catch(error: any) {
        toast({
            variant: "destructive",
            title: "Failed to Send Invite",
            description: error.message || "An unexpected error occurred. Please try again."
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Invite a new staff member to the {clientName} client portal. They will receive an email to set their password.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
