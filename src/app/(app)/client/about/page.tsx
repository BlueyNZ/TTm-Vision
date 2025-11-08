
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
          <CardTitle>Our Story</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
            <p>
                At just 21 years old, I started TTM Vision as a solo project, driven by my experiences in the TTM industry and guided by a close family friend. From the very beginning, my goal has been simple — to create an easier, more efficient way to manage jobs, staff, paperwork, and everything else needed to run a TTM company.
            </p>
            <p>
                After using other management platforms, I noticed that many were overly complicated and difficult for new users to navigate. That’s why I set out to build something different — a streamlined, user-friendly solution that anyone can pick up and use with confidence.
            </p>
            <p>
                TTM Vision is built with simplicity and clarity at its core, designed to help TTM companies stay organized, save time, and focus on what really matters — getting the job done safely and efficiently.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
