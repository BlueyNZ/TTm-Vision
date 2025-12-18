'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { usePathname } from 'next/navigation';

interface ErrorLog {
  type: 'error' | 'warn' | 'info' | 'log';
  message: string;
  stack?: string;
  timestamp: any;
  userInfo: {
    uid: string | null;
    email: string | null;
    displayName: string | null;
  };
  pageInfo: {
    pathname: string;
    url: string;
    userAgent: string;
  };
  data?: any;
}

export function useErrorLogger(enabled: boolean = false) {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const logToFirestore = async (
      type: 'error' | 'warn' | 'info' | 'log',
      args: any[]
    ) => {
      try {
        // Don't log in production unless explicitly enabled
        if (process.env.NODE_ENV === 'production' && !localStorage.getItem('dev_logging_enabled')) {
          return;
        }

        const message = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');

        let stack: string | undefined;
        // Extract stack trace if available
        if (args[0] instanceof Error) {
          stack = args[0].stack;
        }

        const errorLog: ErrorLog = {
          type,
          message,
          stack,
          timestamp: Timestamp.now(),
          userInfo: {
            uid: user?.uid || null,
            email: user?.email || null,
            displayName: user?.displayName || null,
          },
          pageInfo: {
            pathname: pathname || 'unknown',
            url: window.location.href,
            userAgent: window.navigator.userAgent,
          },
          data: args.length > 1 ? args : args[0],
        };

        // Store in Firestore
        const logsCollection = collection(firestore, 'dev_logs');
        await addDoc(logsCollection, errorLog);
      } catch (error) {
        // Silently fail to avoid infinite loops
        console.warn('Failed to log to Firestore:', error);
      }
    };

    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    // Only intercept errors and warnings for logging
    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      logToFirestore('error', args);
    };

    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      logToFirestore('warn', args);
    };

    // Optional: Also catch unhandled errors
    const handleError = (event: ErrorEvent) => {
      logToFirestore('error', [event.error || event.message]);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logToFirestore('error', [event.reason]);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enabled, user, firestore, pathname]);

  return null;
}
