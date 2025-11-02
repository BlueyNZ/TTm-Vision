import { jobData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, MoreHorizontal, Clock, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


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
              <TableHead className="hidden lg:table-cell">Site</TableHead>
              <TableHead className="hidden md:table-cell">Staff</TableHead>
              <TableHead className="hidden lg:table-cell">Times</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobData.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  <div className="font-medium">{job.jobId}</div>
                  <div className="text-sm text-muted-foreground">{format(job.date, 'eee, dd MMM')}</div>
                </TableCell>
                <TableCell>{job.client}</TableCell>
                <TableCell className="hidden lg:table-cell">{job.siteAddress}</TableCell>
                <TableCell className="hidden md:table-cell">
                   <div className="flex items-center space-x-[-10px]">
                      <TooltipProvider>
                        {job.staff.map(staffMember => (
                          <Tooltip key={staffMember.id}>
                            <TooltipTrigger asChild>
                              <Avatar className="border-2 border-background">
                                <AvatarImage src={`https://picsum.photos/seed/${staffMember.id}/200/200`} />
                                <AvatarFallback>{staffMember.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{staffMember.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{job.startTime} (On-site: {job.onSiteTime})</span>
                  </div>
                </TableCell>
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
                       {job.permitUrl && <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        View Permit
                      </DropdownMenuItem>}
                      <DropdownMenuItem>View Details</DropdownMenuItem>
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
