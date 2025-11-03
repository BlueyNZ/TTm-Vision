
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
