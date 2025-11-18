
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Info } from 'lucide-react';
import Image from 'next/image';

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

      <div className="flex flex-col items-center justify-center gap-4 pt-4">
        <Image
          src="https://scontent.fwlg2-1.fna.fbcdn.net/v/t39.30808-6/412351838_3645511082381989_472384732353303644_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=6825c5&_nc_ohc=JqZXk9p9qj0Q7kNvgEWz1xP&_nc_ht=scontent.fwlg2-1.fna&oh=00_AYCZTv-B2a8yA4n1zV9w6kHjY-zT7d1F3rDk2oE6YJSL8A&oe=669A4C62"
          alt="Founder/Owner - Harrison Price"
          width={150}
          height={150}
          className="rounded-full"
          data-ai-hint="founder photo"
        />
        <div className="text-center">
            <p className="text-xl font-semibold">Harrison Price</p>
            <p className="text-muted-foreground">Founder/Owner</p>
        </div>
      </div>
    </div>
  );
}
