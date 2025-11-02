
'use client';
import { Job } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Circle, Eye, Edit, LoaderCircle } from "lucide-react";
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
import { useEffect, useState } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, Timestamp } from "firebase/firestore";

const getStatusVariant = (status: Job['status']) => {
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

const getStatusColor = (status: Job['status']) => {
  switch (status) {
    case 'In Progress':
      return 'fill-success';
    case 'On Hold':
      return 'fill-warning';
    default:
      return 'fill-muted-foreground';
  }
};

const ClientFormattedDate = ({ date }: { date: Date | Timestamp | string }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    let d: Date;
    if (date instanceof Timestamp) {
      d = date.toDate();
    } else {
      d = new Date(date);
    }
    setFormattedDate(format(d, 'dd MMM yyyy, HH:mm'));
  }, [date]);

  return <>{formattedDate || '...'}</>;
}


export default function JobsPage() {
  const router = useRouter();
  const firestore = useFirestore();

  const jobsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'job_packs');
  }, [firestore]);

  const { data: jobData, isLoading } = useCollection<Job>(jobsCollection);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Job Management</CardTitle>
          <CardDescription>
            View, create, and manage all jobs.
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/jobs/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Job
          </Link>
        </Button>
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
              <TableHead>Location</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden lg:table-cell">Start Date</TableHead>
              <TableHead>STMS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobData?.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.location}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{job.name}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  <ClientFormattedDate date={job.startDate} />
                </TableCell>
                <TableCell>{job.stms || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(job.status)} className="flex items-center gap-2 w-fit">
                    <Circle className={cn("h-2 w-2", getStatusColor(job.status))}/>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => router.push(`/jobs/${job.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
