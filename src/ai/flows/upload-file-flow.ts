
'use server';
/**
 * @fileOverview A Genkit flow for uploading files to Firebase Storage.
 * This flow is designed to be called from the client-side to handle file uploads securely on the server.
 * Falls back to direct HTTP upload if Admin SDK fails.
 * 
 * File Storage Structure (Multi-Tenant):
 * - tenants/{tenantId}/jobs/{jobId}/tmp/{filename} - TMP files
 * - tenants/{tenantId}/jobs/{jobId}/wap/{filename} - WAP files
 * - tenants/{tenantId}/jobs/{jobId}/incident_attachments/{filename} - Incident report attachments
 * - tenants/{tenantId}/jobs/{jobId}/job_notes_attachments/{filename} - Job note attachments
 * 
 * Legacy paths (for backward compatibility):
 * - jobs/{jobId}/... - Old non-tenant-specific paths
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebaseOnServer } from '@/firebase/server-init';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from '@/firebase/config';

const UploadFileInputSchema = z.object({
  filePath: z.string().describe('The full path where the file should be stored in Firebase Storage, including the file name (e.g., "tenants/{tenantId}/jobs/{jobId}/tmp/document.pdf").'),
  fileData: z.string().describe("The Base64 encoded string of the file data."),
  fileName: z.string().describe("The name of the file."),
  fileType: z.string().describe("The MIME type of the file (e.g., 'application/pdf')."),
});

export type UploadFileInput = z.infer<typeof UploadFileInputSchema>;

const UploadFileOutputSchema = z.object({
  downloadUrl: z.string().describe('The public URL to access the uploaded file.'),
});

export type UploadFileOutput = z.infer<typeof UploadFileOutputSchema>;


// Helper function to upload via direct HTTP request
async function uploadViaDirectHttp(
  filePath: string,
  base64Data: string,
  fileType: string
): Promise<string> {
  try {
    const storageBucket = firebaseConfig.storageBucket;
    const encodedPath = encodeURIComponent(filePath);
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o?name=${encodedPath}`;
    
    // Convert base64 to binary
    const binary = Buffer.from(base64Data.split(',')[1], 'base64');
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': fileType,
      },
      body: binary,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    // Return a download URL
    return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodedPath}?alt=media`;
  } catch (error) {
    console.error('Direct HTTP upload failed:', error);
    throw error;
  }
}

export const uploadFileFlow = ai.defineFlow(
  {
    name: 'uploadFileFlow',
    inputSchema: UploadFileInputSchema,
    outputSchema: UploadFileOutputSchema,
  },
  async (input) => {
    const { fileData, filePath, fileType } = input;
    
    // The incoming fileData is a data URL: 'data:mime/type;base64,xxxxxxxx'
    // We need to strip the prefix to get just the base64 data.
    const base64Data = fileData.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid file data format. Expected a Base64 data URL.');
    }

    try {
      // Try Admin SDK approach first
      const app = await initializeFirebaseOnServer();
      const storage = getStorage(app);
      const bucket = storage.bucket(firebaseConfig.storageBucket);
      const buffer = Buffer.from(base64Data, 'base64');
      const file = bucket.file(filePath);

      await file.save(buffer, {
        metadata: {
          contentType: fileType,
        },
      });

      // Make the file public and get the URL
      await file.makePublic();
      const downloadUrl = file.publicUrl();

      return { downloadUrl };
    } catch (adminError) {
      console.error('Admin SDK upload failed, trying direct HTTP:', adminError);
      
      try {
        // Fallback to direct HTTP upload
        const downloadUrl = await uploadViaDirectHttp(filePath, fileData, fileType);
        return { downloadUrl };
      } catch (httpError) {
        console.error('Direct HTTP upload also failed:', httpError);
        throw new Error('File upload failed. Please try again.');
      }
    }
  }
);

export async function uploadFile(input: UploadFileInput): Promise<UploadFileOutput> {
    return uploadFileFlow(input);
}
