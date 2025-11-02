
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { jobData } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const activeJobs = jobData.filter(job => job.status === 'In Progress');

  return (
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
              <TableHead>Job ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="hidden md:table-cell">Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.jobId}</TableCell>
                <TableCell>{job.client}</TableCell>
                <TableCell className="hidden md:table-cell">{job.siteAddress}</TableCell>
                <TableCell>
                   <Badge variant="outline" className={cn(
                    job.status === 'In Progress' && 'bg-blue-100 text-blue-800 border-blue-200',
                  )}>{job.status}</Badge>
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
  );
}
