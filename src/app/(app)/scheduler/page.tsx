
'use client';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './scheduler.css';
import { Calendar, dateFnsLocalizer, Event as BigCalendarEvent, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, subDays } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Job } from '@/lib/data';
import { collection, Timestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { LoaderCircle, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DateGrid } from '@/components/scheduler/date-grid';
import { Button } from '@/components/ui/button';

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

const CustomToolbar = () => null; // Empty component to hide the toolbar

export default function SchedulerPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.WEEK);

  const jobsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'job_packs');
  }, [firestore]);
  
  const { data: jobData, isLoading } = useCollection<Job>(jobsCollection);

  const events: JobEvent[] = useMemo(() => {
    if (!jobData) return [];
    
    return jobData
      .filter(job => job.status !== 'Cancelled' && job.status !== 'Pending')
      .map(job => {
        const startDate = job.startDate instanceof Timestamp ? job.startDate.toDate() : new Date(job.startDate);
        
        const jobStartTime = job.startTime?.match(/(\d{2}):(\d{2})/) ? job.startTime.split(':') : ['08', '00'];
        startDate.setHours(parseInt(jobStartTime[0], 10), parseInt(jobStartTime[1], 10));

        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 2);

        return {
          title: `${job.jobNumber}: ${job.location}`,
          start: startDate,
          end: endDate,
          resource: { id: job.id },
        };
      });
  }, [jobData]);

  const handleSelectEvent = (event: JobEvent) => {
    router.push(`/jobs/${event.resource.id}`);
  };
  
  const handlePrevDay = () => {
    setCurrentDate(prevDate => subDays(prevDate, 1));
    setView(Views.DAY);
  };
  
  const handleNextDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, 1));
    setView(Views.DAY);
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    setView(Views.DAY);
  }

  const handleShowWeek = () => {
    setCurrentDate(new Date());
    setView(Views.WEEK);
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
         <Button variant="outline" onClick={handleShowWeek}>
          <CalendarDays className="mr-2 h-4 w-4" />
          This Week
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
          view={view}
          onView={(v) => setView(v)}
          views={[Views.DAY, Views.WEEK]}
          components={{
            toolbar: CustomToolbar // Hide the default toolbar
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
