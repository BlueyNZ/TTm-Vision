'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  // TEMP: Disabled for development - navigator.onLine API incorrectly reports offline in dev environment
  return null;
  
  /* 
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowOffline(true);
      // Auto-dismiss offline alert after 5 seconds
      const timer = setTimeout(() => {
        setShowOffline(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (wasOffline && isOnline) {
      // Just came back online
      setShowOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) return null;
  if (!isOnline && !showOffline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      {!isOnline && showOffline ? (
        <Alert variant="destructive" className="shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            <strong>You're offline.</strong> Changes will sync when you're back online.
          </AlertDescription>
        </Alert>
      ) : showReconnected ? (
        <Alert className="shadow-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-600 dark:text-green-400">
            <strong>Back online!</strong> Syncing your changes...
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
  */
}
