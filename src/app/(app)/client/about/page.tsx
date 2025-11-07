
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function ClientAboutUsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Info className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">About TTM Vision</h1>
          <p className="text-muted-foreground">
            Streamlining traffic management for a safer tomorrow.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page is currently under construction. Check back soon for more information about TTM Vision.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
