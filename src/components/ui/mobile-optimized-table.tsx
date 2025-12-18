'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileOptimizedTableProps {
  children: ReactNode;
  className?: string;
}

interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MobileOptimizedTable({ children, className }: MobileOptimizedTableProps) {
  return (
    <div className={cn('space-y-3 md:space-y-0', className)}>
      {children}
    </div>
  );
}

export function MobileCard({ children, onClick, className }: MobileCardProps) {
  return (
    <Card 
      className={cn(
        'p-4 cursor-pointer hover:bg-accent/50 transition-all active:scale-[0.98] md:hidden',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

export function MobileCardRow({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-between items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground font-medium">{label}:</span>
      <span className="text-sm font-medium truncate">{value}</span>
    </div>
  );
}

export function MobileCardSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
}
