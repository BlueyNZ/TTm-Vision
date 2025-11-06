
'use client';
import { useState, useEffect } from 'react';
import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';

interface DateGridProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

export function DateGrid({ currentDate, onDateSelect }: DateGridProps) {
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  useEffect(() => {
    // Setting Sunday as the start of the week
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); 
    const dates = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    setWeekDates(dates);
  }, [currentDate]);

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDates.map((date) => {
        const isCurrentDay = isToday(date);
        return (
          <Button 
            key={date.toString()}
            variant="outline"
            className={cn(
              "text-center p-2 h-auto flex-col",
              isCurrentDay && "bg-primary text-primary-foreground"
            )}
            onClick={() => onDateSelect(date)}
          >
              <p className={cn(
                "text-xs font-medium uppercase",
                isCurrentDay ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {format(date, 'eee')}
              </p>
              <p className="text-2xl font-bold">
                {format(date, 'd')}
              </p>
          </Button>
        );
      })}
    </div>
  );
}
