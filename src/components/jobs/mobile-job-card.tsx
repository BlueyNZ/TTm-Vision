'use client';

import { Job } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Calendar, Users, MoreHorizontal, Circle } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MobileJobCardProps {
  job: Job;
  onView: () => void;
  onEdit: () => void;
  onComplete?: () => void;
  onDelete: () => void;
}

const getDisplayedStatus = (job: Job) => {
  const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
  if (job.status === 'Upcoming' && isPast(startDate)) {
    return 'In Progress';
  }
  return job.status;
};

const getStatusVariant = (status: Job['status']) => {
  switch (status) {
    case 'Upcoming':
      return 'secondary';
    case 'In Progress':
      return 'default';
    case 'Cancelled':
      return 'destructive';
    case 'Completed':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: Job['status']) => {
  switch (status) {
    case 'In Progress':
      return 'text-green-600';
    case 'Cancelled':
      return 'text-red-600';
    case 'Upcoming':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

export function MobileJobCard({ job, onView, onEdit, onComplete, onDelete }: MobileJobCardProps) {
  const status = getDisplayedStatus(job);
  const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);

  return (
    <Card className="p-4 space-y-3 hover:bg-accent/50 transition-all active:scale-[0.98] cursor-pointer" onClick={onView}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Circle className={cn('h-2 w-2 fill-current', getStatusColor(status))} />
            <span className="font-semibold text-sm truncate">{job.jobNumber}</span>
            <Badge variant={getStatusVariant(status)} className="text-xs">
              {status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{job.name}</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              Edit
            </DropdownMenuItem>
            {status === 'In Progress' && onComplete && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComplete(); }}>
                Mark Complete
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              className="text-destructive" 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>{format(startDate, 'dd MMM yyyy')}</span>
          {job.startTime && <span className="text-xs">• {job.startTime}</span>}
        </div>

        {job.clientName && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{job.clientName}</span>
          </div>
        )}
      </div>

      {(job.stms || job.tcs.length > 0) && (
        <div className="pt-2 border-t space-y-1">
          {job.stms && (
            <div className="text-xs">
              <span className="text-muted-foreground">STMS: </span>
              <span className="font-medium">{job.stms}</span>
            </div>
          )}
          {job.tcs.length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">TCs: </span>
              <span className="font-medium">{job.tcs.map(tc => tc.name).join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
