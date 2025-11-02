
'use client';
import { jobData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Circle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

const getStatusVariant = (status: (typeof jobData)[0]['status']) => {
  switch (status) {
    case 'Upcoming':
      return 'default';
    case 'In Progress':
      return 'success';
    case 'On Hold':
      return 'warning';
    case 'Completed':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: (typeof jobData)[0]['status']) => {
  switch (status) {
    case 'In Progress':
      return 'fill-success';
    case 'On Hold':
      return 'fill-warning';
    default:
      return 'fill-muted-foreground';
  }
};

export default function JobsPage() {
  const router = useRouter();
  const handleRowClick = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Job Management</CardTitle>
          <CardDescription>
            View, create, and manage all jobs.
          </CardDescription>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Job
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Name</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden lg:table-cell">Start Date</TableHead>
              <TableHead>STMS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobData.map((job) => (
              <TableRow key={job.id} onClick={() => handleRowClick(job.id)} className="cursor-pointer">
                <TableCell className="font-medium">{job.name}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{job.location}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{format(job.startDate, 'dd MMM yyyy, HH:mm')}</TableCell>
                <TableCell>{job.stms}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(job.status)} className="flex items-center gap-2 w-fit">
                    <Circle className={cn("h-2 w-2", getStatusColor(job.status))}/>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/jobs/${job.id}`}>View Job Pack</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
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
