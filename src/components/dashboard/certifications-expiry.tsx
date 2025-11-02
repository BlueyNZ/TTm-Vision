import { staffData, Staff } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";

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

type CertificationWithStaff = {
  staff: Staff;
  certName: string;
  expiryDate: Date;
};

export function CertificationsExpiry() {
  const expiringCerts: CertificationWithStaff[] = staffData.flatMap(staff => 
    staff.certifications.map(cert => ({
      staff,
      certName: cert.name,
      expiryDate: cert.expiryDate,
    }))
  )
  .filter(cert => differenceInDays(cert.expiryDate, new Date()) < 90)
  .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Certifications Expiry</CardTitle>
        <CardDescription>Staff with certifications expiring soon.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-4 p-6 pt-0">
            {expiringCerts.length > 0 ? expiringCerts.map((cert, index) => {
              const status = getCertificationStatus(cert.expiryDate);
              return (
                <div key={`${cert.staff.id}-${index}`} className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={`https://picsum.photos/seed/${cert.staff.id}/200/200`} />
                    <AvatarFallback>{cert.staff.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{cert.staff.name}</p>
                    <p className="text-sm text-muted-foreground">{cert.certName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={cn(
                        status.variant === "destructive" && "bg-destructive/20 text-destructive-foreground border-destructive",
                        status.variant === "warning" && "bg-warning/20 text-yellow-800 border-warning",
                        status.variant === "success" && "bg-success/20 text-green-800 border-success",
                        "dark:text-white"
                    )}>
                      {status.label === "Expired" ? "Expired" : format(cert.expiryDate, 'dd MMM yyyy')}
                    </Badge>
                     <p className={cn("text-xs mt-1", 
                        status.variant === "destructive" && "text-destructive",
                        status.variant === "warning" && "text-yellow-600",
                        "dark:text-white/70"
                     )}>{status.label}</p>
                  </div>
                </div>
              );
            }) : <p className="text-sm text-muted-foreground text-center py-10">No certifications expiring soon.</p>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
