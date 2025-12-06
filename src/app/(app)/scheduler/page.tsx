
'use client';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './scheduler.css';
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, subDays, isSameDay, eachDayOfInterval } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Job } from '@/lib/data';
import { collection, Timestamp, query, where } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { LoaderCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DateGrid } from '@/components/scheduler/date-grid';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/tenant-context';

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
  const { tenantId } = useTenant();
  const [currentDate, setCurrentDate] = useState(new Date());

  const jobsCollection = useMemoFirebase(() => {
    if (!firestore || !tenantId) return null;
    return query(collection(firestore, 'job_packs'), where('tenantId', '==', tenantId));
  }, [firestore, tenantId]);
  
  const { data: jobData, isLoading } = useCollection<Job>(jobsCollection);

  const events: JobEvent[] = useMemo(() => {
    if (!jobData) return [];

    const dailyEvents: JobEvent[] = [];
    
    const validJobs = jobData.filter(job => job.status !== 'Cancelled' && job.status !== 'Pending');

    validJobs.forEach(job => {
      const jobStart = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
      const jobEnd = job.endDate ? (job.endDate instanceof Timestamp ? job.endDate.toDate() : new Date(job.endDate)) : jobStart;

      const interval = eachDayOfInterval({
        start: jobStart,
        end: jobEnd,
      });

      interval.forEach(day => {
        if (isSameDay(day, currentDate)) {
            const startDateTime = new Date(day);
            const jobStartTime = job.startTime?.match(/(\d{2}):(\d{2})/) ? job.startTime.split(':') : ['08', '00'];
            startDateTime.setHours(parseInt(jobStartTime[0], 10), parseInt(jobStartTime[1], 10), 0, 0);

            const endDateTime = new Date(startDateTime);
            endDateTime.setHours(startDateTime.getHours() + 2); // Default 2 hour duration

            dailyEvents.push({
              title: `${job.jobNumber}: ${job.location}`,
              start: startDateTime,
              end: endDateTime,
              resource: { id: job.id },
            });
        }
      });
    });

    return dailyEvents.filter(event => isSameDay(event.start!, currentDate));

  }, [jobData, currentDate]);

  const handleSelectEvent = (event: JobEvent) => {
    router.push(`/jobs/${event.resource.id}`);
  };
  
  const handlePrevDay = () => {
    setCurrentDate(prevDate => subDays(prevDate, 1));
  };
  
  const handleNextDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, 1));
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6 h-full'>
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={handlePrevDay} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className='flex-grow'>
          <DateGrid currentDate={currentDate} onDateSelect={handleDateSelect} />
        </div>
        <Button variant="outline" size="icon" onClick={handleNextDay} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-grow h-[calc(100vh-16rem)]">
         <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          onNavigate={() => {}} // We handle navigation ourselves
          style={{ height: '100%' }}
          onSelectEvent={handleSelectEvent}
          defaultView='agenda'
          views={['agenda']}
          components={{
            toolbar: () => null // Hide the default toolbar
          }}
          eventPropGetter={(event) => {
            return {
              className: 'bg-primary/80 hover:bg-primary cursor-pointer border-0 text-primary-foreground p-2 rounded-md',
            };
          }}
        />
      </div>
    </div>
  );
}
