// src/components/FirebaseErrorListener.tsx
'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error('Firestore Permission Error:', error.toString());

      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: error.message,
      });

      // In a real app, you might want to throw the error
      // to let an error boundary catch it and display a user-friendly
      // error page.
      //
      // For this prototype, we will re-throw the error in development
      // to leverage the Next.js error overlay.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
