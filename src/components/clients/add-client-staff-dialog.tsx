
'use client';
import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { addDoc, collection, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { Staff } from "@/lib/data";

const addStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  clientRole: z.enum(['Admin', 'Staff']),
});

type AddClientStaffDialogProps = {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffToEdit?: Staff | null;
  onDialogClose: () => void;
};

export function AddClientStaffDialog({ clientId, clientName, open, onOpenChange, staffToEdit, onDialogClose }: AddClientStaffDialogProps) {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!staffToEdit;

  const form = useForm<z.infer<typeof addStaffSchema>>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: { name: "", email: "", clientRole: 'Staff' },
  });

  useEffect(() => {
    if (staffToEdit) {
      form.reset({
        name: staffToEdit.name,
        email: staffToEdit.email,
        clientRole: staffToEdit.clientRole || 'Staff',
      });
    } else {
      form.reset({ name: "", email: "", clientRole: 'Staff' });
    }
  }, [staffToEdit, form]);

  async function onSubmit(data: z.infer<typeof addStaffSchema>) {
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "Services not available." });
        return;
    }

    setIsSubmitting(true);
    
    try {
        if (isEditMode && staffToEdit) {
            // Edit existing staff's role
            const staffDocRef = doc(firestore, 'staff', staffToEdit.id);
            await setDoc(staffDocRef, { clientRole: data.clientRole }, { merge: true });
            toast({
                title: "Role Updated",
                description: `${staffToEdit.name}'s role has been updated to ${data.clientRole}.`,
            });
        } else {
            // Invite new staff
            const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, tempPassword);
            const user = userCredential.user;

            const staffDocRef = doc(firestore, 'staff', user.uid);
            await setDoc(staffDocRef, {
                id: user.uid,
                name: data.name,
                email: data.email,
                clientId: clientId,
                accessLevel: 'Client Staff',
                clientRole: data.clientRole, // Save the selected role
                role: 'Operator',
                createdAt: serverTimestamp(),
                phone: "",
                certifications: [],
                licenses: [],
                emergencyContact: { name: "", phone: "" },
            });

            await sendPasswordResetEmail(auth, data.email, {
                url: `${window.location.origin}/complete-signup`,
                handleCodeInApp: true,
            });

            toast({
                title: "Invitation Sent",
                description: `${data.name} has been invited as a(n) ${data.clientRole}.`,
            });
        }
      
      form.reset();
      onDialogClose();

    } catch(error: any) {
        toast({
            variant: "destructive",
            title: isEditMode ? "Failed to Update Role" : "Failed to Send Invite",
            description: error.code === 'auth/email-already-in-use' ? 'A user with this email already exists.' : (error.message || "An unexpected error occurred.")
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Staff Role" : "Add New Staff Member"}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? `Change the role for ${staffToEdit.name}.`
              : `Invite a new staff member to the ${clientName} client portal.`
            }
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
                    <Input placeholder="John Doe" {...field} disabled={isEditMode} />
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
                    <Input type="email" placeholder="john.doe@example.com" {...field} disabled={isEditMode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Admin">Admin (Full Access)</SelectItem>
                            <SelectItem value="Staff">Staff (Dashboard Only)</SelectItem>
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
                {isEditMode ? "Save Changes" : "Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
