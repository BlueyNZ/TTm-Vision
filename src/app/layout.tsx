
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Footer } from '@/components/layout/footer';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  viewportFit: 'cover', // For iPhone notch support
};

export const metadata: Metadata = {
  title: {
    default: 'TTM Vision - Traffic Management Software',
    template: '%s | TTM Vision',
  },
  description: 'Complete traffic management solution for your business. Manage jobs, staff, fleet tracking, scheduling, and paperwork all in one place.',
  keywords: ['traffic management', 'TTM', 'fleet management', 'job scheduling', 'STMS', 'traffic control'],
  authors: [{ name: 'TTM Vision' }],
  creator: 'TTM Vision',
  publisher: 'TTM Vision',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ttm-vision.vercel.app'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TTM Vision',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'TTM Vision - Traffic Management Software',
    description: 'Complete traffic management solution for your business. Manage jobs, staff, fleet tracking, scheduling, and paperwork all in one place.',
    siteName: 'TTM Vision',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TTM Vision - Traffic Management Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TTM Vision - Traffic Management Software',
    description: 'Complete traffic management solution for your business. Manage jobs, staff, fleet tracking, scheduling, and paperwork all in one place.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#f97316" />
      </head>
      <body className="font-body antialiased">
        <ServiceWorkerRegistration />
        <div className="flex min-h-screen flex-col">
          <FirebaseClientProvider>
            <div className="flex-1">{children}</div>
          </FirebaseClientProvider>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
