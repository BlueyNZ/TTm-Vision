
import { jobData } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Briefcase, Calendar, Clock, MapPin, Users, AlertTriangle, CheckCircle, FileText, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const job = jobData.find(j => j.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-1 flex items-center gap-2">
                <Briefcase className="h-6 w-6" />
                Job Details
              </CardTitle>
              <CardDescription>{job.jobId} - {job.client}</CardDescription>
            </div>
            <Badge variant="outline" className="text-base">{job.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span>{job.siteAddress}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>{format(job.date, 'eeee, dd MMMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>Start: {job.startTime} (On-site: {job.onSiteTime})</span>
            </div>
          </div>
          {job.permitUrl && (
             <Button variant="outline" asChild className="mt-4">
                <Link href={job.permitUrl} target="_blank">
                  <FileText className="mr-2 h-4 w-4" />
                  View Permit
                </Link>
              </Button>
          )}
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Assigned Staff</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-4">
              {job.staff.map(staffMember => (
                <div key={staffMember.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://picsum.photos/seed/${staffMember.id}/200/200`} />
                    <AvatarFallback>{staffMember.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{staffMember.name}</p>
                    <p className="text-sm text-muted-foreground">{staffMember.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Reported Hazards</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            {job.hazards.length > 0 ? (
              <div className="space-y-4">
                {job.hazards.map((hazard, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <Avatar className="mt-1">
                        <AvatarImage src={`https://picsum.photos/seed/${job.staff.find(s=>s.name === hazard.reportedBy)?.id}/200/200`}/>
                        <AvatarFallback>{hazard.reportedBy.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">{hazard.description}</p>
                      <p className="text-xs text-muted-foreground">Reported by {hazard.reportedBy}</p>
                       {hazard.photoUrl && <div className="mt-2">
                        <Image src={hazard.photoUrl} alt="Hazard photo" width={200} height={150} className="rounded-md object-cover" />
                      </div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No hazards reported for this job.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {job.completionDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Completion Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <h4 className="font-medium mb-2">Client Sign-off</h4>
                <p>Client Representative: <span className="text-muted-foreground">{job.completionDetails.clientName}</span></p>
                {job.completionDetails.signatureUrl && <div className="mt-2 p-4 border rounded-md bg-muted/40 w-fit">
                    <p className="text-sm text-muted-foreground mb-2">Signature:</p>
                    <Image src={job.completionDetails.signatureUrl} alt="Client Signature" width={200} height={100} className="rounded-md bg-white"/>
                </div>}
            </div>
            <Separator />
            <div>
                <h4 className="font-medium mb-2">Completion Photo</h4>
                 <Image src={job.completionDetails.photoUrl} alt="Job completion photo" width={400} height={300} className="rounded-md object-cover" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
