
'use client';
import { useState, useEffect } from 'react';
import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export function DateGrid() {
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  useEffect(() => {
    const today = new Date();
    // Setting Sunday as the start of the week
    const start = startOfWeek(today, { weekStartsOn: 0 }); 
    const dates = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    setWeekDates(dates);
  }, []);

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDates.map((date) => {
        const isCurrentDay = isToday(date);
        return (
          <Card 
            key={date.toString()}
            className={cn(
              "text-center p-2",
              isCurrentDay && "bg-primary text-primary-foreground"
            )}
          >
            <CardContent className="p-0 flex flex-col items-center justify-center">
              <p className={cn(
                "text-xs font-medium uppercase",
                isCurrentDay ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {format(date, 'eee')}
              </p>
              <p className="text-2xl font-bold">
                {format(date, 'd')}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
