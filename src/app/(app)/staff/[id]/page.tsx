'use client';

import { Staff } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Shield, User, Award, Edit, LoaderCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AddStaffDialog } from "@/components/staff/add-staff-dialog";
import { Button } from "@/components/ui/button";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, Timestamp } from "firebase/firestore";
import { useParams } from "next/navigation";

function getCertificationStatus(expiryDate: Date): { label: string, variant: "destructive" | "warning" | "success" } {
  const today = new Date();
  const daysUntilExpiry = differenceInDays(expiryDate, today);

  if (daysUntilExpiry < 0) {
    return { label: "Expired", variant: "destructive" };
  }
  if (daysUntilExpiry <= 30) {
    return { label: `Expires in ${daysUntilExpiry}d`, variant: "warning" };
  }
  return { label: "Valid", variant: "success" };
}


export default function StaffProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const firestore = useFirestore();
  const params = useParams();
  const staffId = params.id as string;

  const staffMemberRef = useMemoFirebase(() => {
    if (!firestore || !staffId) return null;
    return doc(firestore, 'staff', staffId);
  }, [firestore, staffId]);

  const { data: staffMember, isLoading } = useDoc<Staff>(staffMemberRef);
  
  const handleEditStaff = () => {
    // This will now be handled by the dialog's direct Firestore update
    setIsEditing(false);
  };


  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!staffMember) {
    return <p>Staff member not found.</p>;
  }
  
  const sortedCerts = staffMember.certifications ? [...staffMember.certifications].sort((a, b) => {
    const dateA = a.expiryDate instanceof Timestamp ? a.expiryDate.toDate() : new Date(a.expiryDate);
    const dateB = b.expiryDate instanceof Timestamp ? b.expiryDate.toDate() : new Date(b.expiryDate);
    return dateA.getTime() - dateB.getTime();
  }) : [];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={`https://picsum.photos/seed/${staffMember.id}/200/200`} alt={staffMember.name} />
                <AvatarFallback>{staffMember.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle>{staffMember.name}</CardTitle>
              <CardDescription>{staffMember.role}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  <div className="flex items-center gap-4">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div className="text-sm">
                          <p className="font-medium">Emergency Contact</p>
                          <p className="text-muted-foreground">{staffMember.emergencyContact.name}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                       <div className="text-sm">
                          <p className="font-medium">Emergency Number</p>
                          <p className="text-muted-foreground">{staffMember.emergencyContact.phone}</p>
                      </div>
                  </div>
                   <div className="flex items-center gap-4">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                       <div className="text-sm">
                          <p className="font-medium">Access Level</p>
                          <p className="text-muted-foreground">{staffMember.accessLevel}</p>
                      </div>
                  </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>
                All qualifications and their expiry dates for {staffMember.name}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedCerts.length > 0 ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Certification</TableHead>
                              <TableHead>Expiry Date</TableHead>
                              <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {sortedCerts.map((cert, index) => {
                              const expiryDate = cert.expiryDate instanceof Timestamp ? cert.expiryDate.toDate() : new Date(cert.expiryDate);
                              const status = getCertificationStatus(expiryDate);
                              return (
                                  <TableRow key={index}>
                                      <TableCell className="font-medium">{cert.name}</TableCell>
                                      <TableCell>{format(expiryDate, "dd MMM yyyy")}</TableCell>
                                      <TableCell className="text-right">
                                          <Badge variant="outline" className={cn(
                                              status.variant === "destructive" && "bg-destructive/20 text-destructive-foreground border-destructive",
                                              status.variant === "warning" && "bg-warning/20 text-yellow-800 border-warning",
                                              status.variant === "success" && "bg-success/20 text-green-800 border-success"
                                          )}>
                                              {status.label}
                                          </Badge>
                                      </TableCell>
                                  </TableRow>
                              )
                          })}
                      </TableBody>
                  </Table>
              ) : (
                  <div className="text-center py-10 text-muted-foreground">
                      <Award className="mx-auto h-12 w-12" />
                      <p className="mt-4">No certifications on record.</p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {isEditing && (
        <AddStaffDialog
          staffToEdit={staffMember}
          onDialogClose={handleEditStaff}
          open={isEditing}
          onOpenChange={(isOpen) => !isOpen && setIsEditing(false)}
        >
          <></>
        </AddStaffDialog>
      )}
    </>
  );
}
