
'use client';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './scheduler.css';
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Job } from '@/lib/data';
import { collection, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface JobEvent extends BigCalendarEvent {
  resource: {
    id: string;
  };
}

export default function SchedulerPage() {
  const firestore = useFirestore();
  const router = useRouter();

  const jobsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'job_packs');
  }, [firestore]);
  
  const { data: jobData, isLoading } = useCollection<Job>(jobsCollection);

  const events: JobEvent[] = useMemo(() => {
    if (!jobData) return [];
    
    return jobData
      .filter(job => job.status !== 'Cancelled' && job.status !== 'Pending') // Filter out cancelled or pending jobs
      .map(job => {
        const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
        return {
          title: `${job.jobNumber}: ${job.location}`,
          start: startDate,
          end: startDate, // Assuming jobs are single-day events
          allDay: true, // This makes the event appear at the top, not in the time grid
          resource: { id: job.id },
        };
      });
  }, [jobData]);

  const handleSelectEvent = (event: JobEvent) => {
    router.push(`/jobs/${event.resource.id}`);
  };
  
  const calendarViews = useMemo(() => [Views.WEEK, Views.AGENDA], []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
       <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleSelectEvent}
        views={calendarViews}
        defaultView={Views.WEEK}
        eventPropGetter={(event) => {
          return {
            className: 'bg-primary/80 hover:bg-primary cursor-pointer border-0',
          };
        }}
      />
    </div>
  );
}
