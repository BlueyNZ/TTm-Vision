
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { jobData } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DashboardPage() {
  const activeJobs = jobData.filter(job => job.status === 'In Progress');

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to TrafficFlow</CardTitle>
            <CardDescription>
              This is your main dashboard. Key administrative metrics have been moved to the Admin section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You can view and manage jobs, staff, and fleet from the sidebar.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
            <CardDescription>A list of jobs currently in progress.</CardDescription>
          </CardHeader>
          <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Times</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="font-medium">{job.jobId}</div>
                    <div className="text-sm text-muted-foreground">{job.client}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{job.siteAddress}</TableCell>
                  <TableCell className="hidden lg:table-cell">{format(job.date, 'dd MMM yyyy')}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div>Start: {job.startTime}</div>
                    <div className="text-sm text-muted-foreground">On-site: {job.onSiteTime}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center -space-x-2">
                      {job.staff.map(staffMember => (
                        <Tooltip key={staffMember.id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={`https://picsum.photos/seed/${staffMember.id}/200/200`} />
                              <AvatarFallback>{staffMember.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{staffMember.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/jobs">View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        {activeJobs.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No active jobs at the moment.
          </div>
        )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
