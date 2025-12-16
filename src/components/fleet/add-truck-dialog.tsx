
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
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "@/lib/data";
import { useFirestore } from "@/firebase";
import { collection, doc, Timestamp } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useTenant } from "@/contexts/tenant-context";

const truckSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  plate: z.string().min(1, "Plate is required."),
  status: z.enum(['Operational', 'Check Required', 'In Service']),
  currentKms: z.coerce.number().min(0, "KMs must be a positive number."),
  lastServiceDate: z.date(),
  nextServiceDate: z.date(),
  nextServiceKms: z.coerce.number().min(0, "Next service KMs must be positive."),
});

type TruckDialogProps = {
  children: React.ReactNode;
  truckToEdit?: Truck | null;
  onDialogClose: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddTruckDialog({ children, truckToEdit, onDialogClose, open: controlledOpen, onOpenChange: setControlledOpen }: TruckDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const isEditMode = !!truckToEdit;
  const { toast } = useToast();
  const firestore = useFirestore();
  const { tenantId } = useTenant();

  const form = useForm<z.infer<typeof truckSchema>>({
    resolver: zodResolver(truckSchema),
  });

  useEffect(() => {
    if (open) {
      if (isEditMode && truckToEdit) {
        form.reset({
          name: truckToEdit.name,
          plate: truckToEdit.plate,
          status: truckToEdit.status,
          currentKms: truckToEdit.currentKms,
          lastServiceDate: truckToEdit.service.lastServiceDate instanceof Timestamp 
            ? truckToEdit.service.lastServiceDate.toDate() 
            : new Date(truckToEdit.service.lastServiceDate),
          nextServiceDate: truckToEdit.service.nextServiceDate instanceof Timestamp 
            ? truckToEdit.service.nextServiceDate.toDate()
            : new Date(truckToEdit.service.nextServiceDate),
          nextServiceKms: truckToEdit.service.nextServiceKms,
        });
      } else {
        form.reset({
          name: "",
          plate: "",
          status: "Operational",
          currentKms: 0,
          lastServiceDate: new Date(),
          nextServiceDate: new Date(),
          nextServiceKms: 0,
        });
      }
    }
  }, [truckToEdit, form, isEditMode, open]);

  function onSubmit(data: z.infer<typeof truckSchema>) {
    if (!firestore) return;
    
    // Validate tenantId exists before creating
    if (!tenantId) {
      toast({
        title: "Error",
        description: "Unable to determine your company. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    const truckPayload = {
      tenantId,
      name: data.name,
      plate: data.plate,
      status: data.status,
      currentKms: data.currentKms,
      service: {
        lastServiceDate: Timestamp.fromDate(data.lastServiceDate),
        nextServiceDate: Timestamp.fromDate(data.nextServiceDate),
        nextServiceKms: data.nextServiceKms,
      },
      // Keep fuelLog if it exists, otherwise initialize to empty
      fuelLog: isEditMode && truckToEdit ? truckToEdit.fuelLog : [],
    };

    if (isEditMode && truckToEdit) {
      const truckDocRef = doc(firestore, 'trucks', truckToEdit.id);
      setDocumentNonBlocking(truckDocRef, truckPayload, { merge: true });
      toast({
        title: "Truck Updated",
        description: `${data.name}'s details have been updated.`,
      });
    } else {
      const truckCollectionRef = collection(firestore, 'trucks');
      addDocumentNonBlocking(truckCollectionRef, truckPayload);
      toast({
        title: "Truck Added",
        description: `${data.name} has been added to the fleet.`,
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
          <DialogTitle>{isEditMode ? 'Edit Truck' : 'Add New Truck'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details of the truck below.' : 'Enter the details of the new truck below.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Truck Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Big Bertha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Licence Plate</FormLabel>
                  <FormControl>
                    <Input placeholder="TRUCK1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="currentKms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Kilometers</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="150000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Operational">Operational</SelectItem>
                      <SelectItem value="Check Required">Check Required</SelectItem>
                      <SelectItem value="In Service">In Service</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="lastServiceDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Last Service</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
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
                name="nextServiceDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Next Service</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
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
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
              control={form.control}
              name="nextServiceKms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Service KMs</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="160000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); onDialogClose(); }}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Truck'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
