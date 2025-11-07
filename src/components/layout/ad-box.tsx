'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { ads as adData, Ad } from '@/lib/ads';

export function AdBox() {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    // This runs only on the client, after the component has mounted.
    // It prevents a hydration mismatch where the server and client render different ads.
    const randomAd = adData[Math.floor(Math.random() * adData.length)];
    setAd(randomAd);
  }, []);

  // Render a placeholder or nothing until the client-side effect runs
  if (!ad) {
    return (
      <div className="p-2 group-data-[collapsible=icon]:hidden">
        <Card className="bg-sidebar-accent border-sidebar-border">
          <CardContent className="p-2 h-[130px] animate-pulse" />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 group-data-[collapsible=icon]:hidden">
      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardContent className="p-2">
          <Link href={ad.linkUrl} passHref legacyBehavior>
            <a target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-center">
              <Image
                src={ad.imageUrl}
                alt={ad.altText}
                width={200}
                height={100}
                className="rounded-md"
                data-ai-hint={ad.imageHint}
              />
              <p className="text-xs text-sidebar-foreground/70">
                Sponsored by <span className="font-semibold underline">{ad.sponsor}</span>
              </p>
            </a>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
