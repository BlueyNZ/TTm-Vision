
import { jobData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";


export default function JobsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Packs</CardTitle>
        <CardDescription>Manage and view all scheduled and active jobs.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobData.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.jobId}</TableCell>
                <TableCell>{job.client}</TableCell>
                <TableCell>{job.siteAddress}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    job.status === 'In Progress' && 'bg-blue-100 text-blue-800 border-blue-200',
                    job.status === 'Completed' && 'bg-success/20 text-green-800 border-success',
                    job.status === 'Cancelled' && 'bg-destructive/20 text-destructive-foreground border-destructive'
                  )}>{job.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       {job.permitUrl && (
                        <DropdownMenuItem asChild>
                          <Link href={job.permitUrl} target="_blank">
                            <FileText className="mr-2 h-4 w-4" />
                            View Permit
                          </Link>
                        </DropdownMenuItem>
                       )}
                      <DropdownMenuItem asChild>
                        <Link href={`/jobs/${job.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Log Hazard</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
