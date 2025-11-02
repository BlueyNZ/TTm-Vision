
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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Staff } from "@/lib/data";

const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  role: z.enum(["TC", "STMS", "Operator"]),
  certifications: z.array(z.object({
    name: z.enum(["TTM", "TMO-NP", "TMO", "STMS-U", "STMS-L1", "STMS-L2", "STMS-L3", "STMS-NP"]),
    expiryDate: z.date(),
  })).optional(),
  emergencyContactName: z.string().min(2, "Emergency contact name is required."),
  emergencyContactNumber: z.string().min(8, "Emergency contact number is required."),
  accessLevel: z.enum(["Staff Member", "Admin"]),
});

type StaffFormValues = z.infer<typeof staffSchema>;

type StaffDialogProps = {
  children: React.ReactNode;
  staffToEdit?: Staff | null;
  onAddStaff: (staff: Omit<Staff, 'id' | 'avatarUrl'>) => void;
  onEditStaff?: (staff: Staff) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddStaffDialog({ children, staffToEdit, onAddStaff, onEditStaff, open: controlledOpen, onOpenChange: setControlledOpen }: StaffDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const isEditMode = !!staffToEdit;
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: isEditMode ? {
      name: staffToEdit.name,
      role: staffToEdit.role,
      certifications: staffToEdit.certifications,
      // Assuming these fields will be added to the Staff type
      emergencyContactName: "Jane Doe", 
      emergencyContactNumber: "021 987 6543",
      accessLevel: "Staff Member",
    } : {
      name: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      certifications: [],
    },
  });

  useEffect(() => {
    if (isEditMode) {
      form.reset({
        name: staffToEdit.name,
        role: staffToEdit.role,
        certifications: staffToEdit.certifications.map(c => ({...c, expiryDate: new Date(c.expiryDate)})),
        // These fields would be populated from staffToEdit if they existed on the type
        emergencyContactName: "Jane Doe",
        emergencyContactNumber: "0219876543",
        accessLevel: "Staff Member"
      });
    } else {
      form.reset({
        name: "",
        role: undefined,
        certifications: [],
        emergencyContactName: "",
        emergencyContactNumber: "",
        accessLevel: undefined,
      });
    }
  }, [staffToEdit, form, isEditMode, open]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "certifications",
  });

  function onSubmit(data: StaffFormValues) {
    if (isEditMode && onEditStaff) {
      onEditStaff({ ...staffToEdit, ...data, certifications: data.certifications || [] });
      toast({
        title: "Staff Updated",
        description: `${data.name}'s details have been updated.`,
      });
    } else {
      onAddStaff({
        name: data.name,
        role: data.role,
        certifications: data.certifications || [],
      });
      toast({
        title: "Staff Added",
        description: `${data.name} has been added to the team.`,
      });
    }
    
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditMode && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <Label>Certifications</Label>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
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
                              <SelectItem value="TTM">TTM</SelectItem>
                              <SelectItem value="TMO-NP">TMO-NP</SelectItem>
                              <SelectItem value="TMO">TMO</SelectItem>
                              <SelectItem value="STMS-U">STMS-U</SelectItem>
                              <SelectItem value="STMS-L1">STMS-L1</SelectItem>
                              <SelectItem value="STMS-L2">STMS-L2</SelectItem>
                              <SelectItem value="STMS-L3">STMS-L3</SelectItem>
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
                                    <span>Expiry Date</span>
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
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                 <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ name: 'TTM', expiryDate: new Date() })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Certification
                </Button>
              </div>
            </div>

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
                  <FormLabel>System Access Level</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Staff Member">Staff Member</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Staff'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
