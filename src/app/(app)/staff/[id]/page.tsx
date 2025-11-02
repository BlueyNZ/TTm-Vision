
import { staffData, Staff } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Shield, User, Award, Calendar, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

function getCertificationStatus(expiryDate: Date): { label: string, variant: "destructive" | "warning" | "success" } {
  const today = new Date();
  const daysUntilExpiry = differenceInDays(new Date(expiryDate), today);

  if (daysUntilExpiry < 0) {
    return { label: "Expired", variant: "destructive" };
  }
  if (daysUntilExpiry <= 30) {
    return { label: `Expires in ${daysUntilExpiry}d`, variant: "warning" };
  }
  return { label: "Valid", variant: "success" };
}


export default function StaffProfilePage({ params }: { params: { id: string } }) {
  const staffMember = staffData.find((s) => s.id === params.id);

  if (!staffMember) {
    notFound();
  }
  
  const sortedCerts = [...staffMember.certifications].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  return (
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
                            const status = getCertificationStatus(cert.expiryDate);
                            return (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{cert.name}</TableCell>
                                    <TableCell>{format(new Date(cert.expiryDate), "dd MMM yyyy")}</TableCell>
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
  );
}
