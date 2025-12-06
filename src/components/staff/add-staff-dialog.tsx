
"use client";

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
  FormDescription,
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
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Staff } from "@/lib/data";
import { useFirestore } from "@/firebase";
import { collection, doc, Timestamp } from "firebase/firestore";
import { addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useTenant } from "@/contexts/tenant-context";
import { Separator } from "../ui/separator";

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(1, "Phone number is required."),
  role: z.enum(["TC", "STMS", "Operator", "Owner", "Tester"]),
  certifications: z.array(z.object({
    name: z.enum(["TTMW", "TMO-NP", "TMO", "STMS-U", "STMS (CAT A)", "STMS (CAT B)", "STMS (CAT C)", "STMS-NP"]),
    expiryDate: z.date({ required_error: "An expiry date is required."}),
  })).optional(),
  licenses: z.array(z.object({
    name: z.enum(["Class 1 (Learner)", "Class 1 (Restricted)", "Class 1 (Full)", "Class 2", "Class 3", "Class 4", "Class 5", "WTR Endorsement"]),
    expiryDate: z.date({ required_error: "An expiry date is required."}),
  })).optional(),
  emergencyContactName: z.string().min(2, "Emergency contact name is required."),
  emergencyContactNumber: z.string().min(8, "Emergency contact number is required."),
  accessLevel: z.enum(["Staff Member", "Admin", "Client", "Client Staff"]),
});

type StaffDialogProps = {
  children: React.ReactNode;
  staffToEdit?: Staff | null;
  onDialogClose: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const DateInput = ({ value, onChange, onBlur, ...props }: { value: Date | undefined, onChange: (date: Date | undefined) => void, onBlur: () => void }) => {
    const [inputValue, setInputValue] = useState(value ? format(value, 'dd/MM/yyyy') : '');
    const [popoverOpen, setPopoverOpen] = useState(false);
    
    useEffect(() => {
        setInputValue(value ? format(value, 'dd/MM/yyyy') : '');
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const parsedDate = parse(e.target.value, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
            onChange(parsedDate);
            setInputValue(format(parsedDate, 'dd/MM/yyyy'));
        } else {
           onChange(undefined);
           setInputValue('');
        }
        onBlur();
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            onChange(date);
            setInputValue(format(date, 'dd/MM/yyyy'));
            setPopoverOpen(false);
        }
    };

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <div className="relative">
                <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder="dd/MM/yyyy"
                    className="pr-10"
                    {...props}
                />
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
            </div>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date("1900-01-01")}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
};


export function AddStaffDialog({ children, staffToEdit, onDialogClose, open: controlledOpen, onOpenChange: setControlledOpen }: StaffDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const isEditMode = !!staffToEdit;
  const { toast } = useToast();
  const firestore = useFirestore();
  const { tenantId } = useTenant();

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: undefined,
      certifications: [],
      licenses: [],
      emergencyContactName: "",
      emergencyContactNumber: "",
      accessLevel: "Staff Member",
    }
  });
  
  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({
    control: form.control,
    name: "certifications",
  });
  const { fields: licenseFields, append: appendLicense, remove: removeLicense } = useFieldArray({
    control: form.control,
    name: "licenses",
  });


  useEffect(() => {
    if (open) {
      if (isEditMode && staffToEdit) {
        const certsWithDates = staffToEdit.certifications?.map(c => ({
          ...c,
          expiryDate: c.expiryDate instanceof Timestamp ? c.expiryDate.toDate() : new Date(c.expiryDate),
        })) || [];
        const licensesWithDates = staffToEdit.licenses?.map(l => ({
          ...l,
          expiryDate: l.expiryDate instanceof Timestamp ? l.expiryDate.toDate() : new Date(l.expiryDate),
        })) || [];

        form.reset({
          name: staffToEdit.name,
          email: staffToEdit.email,
          phone: staffToEdit.phone || '',
          role: staffToEdit.role,
          certifications: certsWithDates,
          licenses: licensesWithDates,
          emergencyContactName: staffToEdit.emergencyContact.name,
          emergencyContactNumber: staffToEdit.emergencyContact.phone,
          accessLevel: staffToEdit.accessLevel,
        });
      } else {
        form.reset({
            name: "",
            email: "",
            phone: "",
            role: undefined,
            certifications: [],
            licenses: [],
            emergencyContactName: "",
            emergencyContactNumber: "",
            accessLevel: "Staff Member",
        });
      }
    }
  }, [staffToEdit, form, isEditMode, open]);


  function onSubmit(data: z.infer<typeof staffSchema>) {
    if (!firestore || !tenantId) return;
    
    const staffPayload = {
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        certifications: data.certifications?.map(cert => ({
          ...cert,
          expiryDate: Timestamp.fromDate(cert.expiryDate)
        })) || [],
        licenses: data.licenses?.map(license => ({
          ...license,
          expiryDate: Timestamp.fromDate(license.expiryDate)
        })) || [],
        emergencyContact: {
            name: data.emergencyContactName,
            phone: data.emergencyContactNumber,
        },
        accessLevel: data.accessLevel,
    };

    if (isEditMode && staffToEdit) {
      const staffDocRef = doc(firestore, 'staff', staffToEdit.id);
      setDocumentNonBlocking(staffDocRef, staffPayload, { merge: true });
      toast({
        title: "Staff Updated",
        description: `${data.name}'s details have been updated.`,
      });
    } else {
      const staffCollectionRef = collection(firestore, 'staff');
      addDocumentNonBlocking(staffCollectionRef, staffPayload);
      toast({
        title: "Staff Added",
        description: `${data.name} has been added to the team.`,
      });
    }
    
    setOpen(false);
    onDialogClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) onDialogClose(); }}>
      {!isEditMode && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details of the staff member below.' : 'Enter the details of the new staff member below.'}
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="021 123 4567" {...field} />
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
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="021 123 4567" {...field} />
                  </FormControl>
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
                      <SelectItem value="Client Staff">Client Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator />

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Certifications</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendCert({ name: 'TTMW', expiryDate: new Date() })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add
                  </Button>
              </div>
              <div className="space-y-2">
                {certFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`certifications.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Cert" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="TTMW">TTMW</SelectItem>
                              <SelectItem value="TMO-NP">TMO-NP</SelectItem>
                              <SelectItem value="TMO">TMO</SelectItem>
                              <SelectItem value="STMS-U">STMS-U</SelectItem>
                              <SelectItem value="STMS (CAT A)">STMS (CAT A)</SelectItem>
                              <SelectItem value="STMS (CAT B)">STMS (CAT B)</SelectItem>
                              <SelectItem value="STMS (CAT C)">STMS (CAT C)</SelectItem>
                              <SelectItem value="STMS-NP">STMS-NP</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`certifications.${index}.expiryDate`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <DateInput {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button variant="ghost" size="icon" type="button" onClick={() => removeCert(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

             <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Driver's Licenses</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendLicense({ name: 'Class 1 (Full)', expiryDate: new Date() })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add
                  </Button>
              </div>
              <div className="space-y-2">
                {licenseFields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <FormField
                      control={form.control}
                      name={`licenses.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select License" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Class 1 (Learner)">Class 1 (Learner)</SelectItem>
                              <SelectItem value="Class 1 (Restricted)">Class 1 (Restricted)</SelectItem>
                              <SelectItem value="Class 1 (Full)">Class 1 (Full)</SelectItem>
                              <SelectItem value="Class 2">Class 2</SelectItem>
                              <SelectItem value="Class 3">Class 3</SelectItem>
                              <SelectItem value="Class 4">Class 4</SelectItem>
                              <SelectItem value="Class 5">Class 5</SelectItem>
                              <SelectItem value="WTR Endorsement">WTR Endorsement</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`licenses.${index}.expiryDate`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <DateInput {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button variant="ghost" size="icon" type="button" onClick={() => removeLicense(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>


            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); onDialogClose(); }}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Staff'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
