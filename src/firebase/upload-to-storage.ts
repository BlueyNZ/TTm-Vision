'use client';

import { getStorage, ref, uploadBytes, getDownloadURL, connectStorageEmulator } from 'firebase/storage';
import { getApp } from 'firebase/app';

/**
 * Upload a file to Firebase Storage using the client-side SDK
 * @param filePath - Path in storage (e.g., "jobs/jobId/tmp/filename.pdf")
 * @param file - The File object to upload
 * @returns Promise with the download URL
 */
export async function uploadFileToStorage(
  filePath: string,
  file: File
): Promise<string> {
  try {
    const app = getApp();
    const storage = getStorage(app);
    
    // Reference to the file location
    const storageRef = ref(storage, filePath);
    
    // Upload the file with metadata
    const snapshot = await uploadBytes(storageRef, file, {
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
      },
    });
    
    console.log('File uploaded successfully:', snapshot.ref.fullPath);
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', downloadUrl);
    
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading file to storage:', error);
    throw error;
  }
}
