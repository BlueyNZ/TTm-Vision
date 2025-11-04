
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
  DialogTrigger,
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
import { Client } from "@/lib/data";
import { useFirestore } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const clientSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters."),
});

type ClientDialogProps = {
  children: React.ReactNode;
  clientToEdit?: Client | null;
  onDialogClose: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddClientDialog({ children, clientToEdit, onDialogClose, open: controlledOpen, onOpenChange: setControlledOpen }: ClientDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const isEditMode = !!clientToEdit;
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    if (open) {
      if (isEditMode && clientToEdit) {
        form.reset({
          name: clientToEdit.name,
        });
      } else {
        form.reset({
          name: "",
        });
      }
    }
  }, [clientToEdit, form, isEditMode, open]);

  function onSubmit(data: z.infer<typeof clientSchema>) {
    if (!firestore) return;
    
    const clientPayload = {
      name: data.name,
    };

    if (isEditMode && clientToEdit) {
      const clientDocRef = doc(firestore, 'clients', clientToEdit.id);
      setDocumentNonBlocking(clientDocRef, clientPayload, { merge: true });
      toast({
        title: "Client Updated",
        description: `The details for ${data.name} have been updated.`,
      });
    } else {
      const clientCollectionRef = collection(firestore, 'clients');
      addDocumentNonBlocking(clientCollectionRef, clientPayload);
      toast({
        title: "Client Added",
        description: `${data.name} has been added to your clients list.`,
      });
    }
    
    setOpen(false);
    onDialogClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) onDialogClose(); }}>
      {!isEditMode && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this client.' : 'Enter the name of the new client company.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fulton Hogan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); onDialogClose(); }}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Client'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
