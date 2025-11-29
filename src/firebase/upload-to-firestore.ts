'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * Upload a file to Firestore as a base64-encoded blob
 * This is a workaround for Firebase Storage bucket issues
 * @param jobId - The job ID
 * @param fileType - 'tmp' or 'wap'
 * @param base64Data - Base64 encoded file data (data URL format)
 * @param fileName - Original file name
 * @returns Object with fileId and fileName
 */
export async function uploadFileToFirestore(
  jobId: string,
  fileType: 'tmp' | 'wap',
  base64Data: string,
  fileName: string
): Promise<{ fileId: string; fileName: string; url: string }> {
  try {
    // Initialize Firebase if not already done
    let app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig as any);
    const db = getFirestore(app);

    // Create a unique ID for this file
    const fileId = `${fileType}-${Date.now()}`;
    const fileDocRef = doc(db, `jobs/${jobId}/files`, fileId);

    // Store file metadata and base64 data in Firestore
    await updateDoc(fileDocRef, {
      fileId,
      fileName,
      fileType,
      base64Data,
      createdAt: new Date(),
      mimeType: 'application/octet-stream',
    } as any);

    // Create a data URL that can be used to download the file
    const dataUrl = base64Data; // Already in data URL format

    console.log('File stored in Firestore:', fileId);

    return {
      fileId,
      fileName,
      url: dataUrl,
    };
  } catch (error) {
    console.error('Error storing file in Firestore:', error);
    throw error;
  }
}

/**
 * Get download URL for a file stored in Firestore
 * Returns a data URL that can be used to download
 */
export function getFirestoreFileUrl(base64Data: string): string {
  return base64Data;
}
