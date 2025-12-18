
'use client';
import { useState, useMemo } from "react";
import Link from "next/link";
import { Staff } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Trash2, Edit, LoaderCircle, Eye, KeyRound } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { AddStaffDialog } from "@/components/staff/add-staff-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useMemoFirebase, useAuth, useUser } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { useTenant } from "@/contexts/tenant-context";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";

const getOverallCertStatus = (staff: Staff) => {
  if (!staff.certifications || staff.certifications.length === 0) {
    return { label: 'No Certs', variant: 'outline' as const };
  }

  const expiringCerts = staff.certifications.filter(c => c.name !== 'TTMW');

  if (expiringCerts.length === 0) {
    // This means the user only has TTMW or no expiring certs
    if (staff.certifications.some(c => c.name === 'TTMW')) {
      return { label: 'Certified', variant: 'outline' as const };
    }
    // This case should ideally not be hit if the first check is for length 0
    return { label: 'No Certs', variant: 'outline' as const };
  }

  let soonestExpiry = Infinity;
  let isExpired = false;

  for (const cert of expiringCerts) {
    const expiryDate = cert.expiryDate instanceof Date ? cert.expiryDate : (cert.expiryDate as any).toDate?.() || new Date(cert.expiryDate);
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    if (daysUntilExpiry < 0) {
      isExpired = true;
      break;
    }
    if (daysUntilExpiry < soonestExpiry) {
      soonestExpiry = daysUntilExpiry;
    }
  }

  if (isExpired) return { label: 'Expired', variant: 'destructive' as const };
  if (soonestExpiry <= 30) return { label: 'Expires Soon', variant: 'warning' as const };
  return { label: 'Valid', variant: 'success' as const };
};


export default function StaffPage() {
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const router = useRouter();
  const { tenantId } = useTenant();
  const auth = useAuth();
  const { user } = useUser();
  
  const staffCollection = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'staff'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  
  const { data: staffData, isLoading } = useCollection<Staff>(staffCollection);

  // Get current user's staff profile to check if they're an admin
  const currentUserStaffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, 'staff'), where('email', '==', user.email));
  }, [firestore, user?.email]);

  const { data: currentUserStaffData } = useCollection<Staff>(currentUserStaffQuery);
  const currentUserStaffProfile = useMemo(() => currentUserStaffData?.[0], [currentUserStaffData]);
  const accessLevel = currentUserStaffProfile?.accessLevel;
  const role = currentUserStaffProfile?.role;
  const isAdmin = accessLevel === 'Admin' || role === 'Owner' || accessLevel === 5 || (typeof accessLevel === 'number' && accessLevel >= 4);

  const handleResetPassword = async (staff: Staff) => {
    if (!auth) {
      toast({
        title: "Error",
        description: "Authentication service not available.",
        variant: "destructive",
      });
      return;
    }

    setResettingPasswordFor(staff.id);

    try {
      await sendPasswordResetEmail(auth, staff.email);
      toast({
        title: "Password Reset Email Sent",
        description: `A password reset email has been sent to ${staff.email}.`,
      });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setResettingPasswordFor(null);
    }
  };

  const handleDeleteStaff = (staff: Staff) => {
    if (!firestore) return;
    const staffDocRef = doc(firestore, 'staff', staff.id);
    deleteDocumentNonBlocking(staffDocRef);
    toast({
      title: "Staff Member Removed",
      description: `${staff.name} has been removed from the staff list.`,
      variant: "destructive",
    });
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Staff Management</CardTitle>
          <CardDescription>
            View and manage all staff members and their certification status.
          </CardDescription>
        </div>
        {(accessLevel === 'Admin' || role === 'Owner') && (
          <Link href="/admin/create-staff">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffData && staffData.map((staff) => {
                const status = getOverallCertStatus(staff);
                return (
                <TableRow key={staff.id}>
                  <TableCell>
                    <Link href={`/staff/${staff.id}`} className="font-medium hover:underline">{staff.name}</Link>
                  </TableCell>
                  <TableCell>{staff.role}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className={cn(
                          status.variant === "destructive" && "bg-destructive/20 text-destructive-foreground border-destructive",
                          status.variant === "warning" && "bg-warning/20 text-yellow-800 border-warning",
                          status.variant === "success" && "bg-success/20 text-green-800 border-success"
                      )}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => router.push(`/staff/${staff.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingStaff(staff)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem 
                            onClick={() => handleResetPassword(staff)}
                            disabled={resettingPasswordFor === staff.id}
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            {resettingPasswordFor === staff.id ? "Sending..." : "Reset Password"}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteStaff(staff)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
     {editingStaff && (
        <AddStaffDialog
          staffToEdit={editingStaff}
          onDialogClose={() => setEditingStaff(null)}
          open={!!editingStaff}
          onOpenChange={(isOpen) => !isOpen && setEditingStaff(null)}
        >
          {/* This is a controlled dialog, trigger is not needed here */}
          <></>
        </AddStaffDialog>
      )}
    </>
  );
}
