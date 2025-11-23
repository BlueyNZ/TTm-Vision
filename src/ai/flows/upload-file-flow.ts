
'use server';
/**
 * @fileOverview A Genkit flow for uploading files to Firebase Storage.
 * This flow is designed to be called from the client-side to handle file uploads securely on the server.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebaseOnServer } from '@/firebase/server-init';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from '@/firebase/config';

const UploadFileInputSchema = z.object({
  filePath: z.string().describe('The full path where the file should be stored in Firebase Storage, including the file name (e.g., "jobs/job123/tmp/document.pdf").'),
  fileData: z.string().describe("The Base64 encoded string of the file data."),
  fileName: z.string().describe("The name of the file."),
  fileType: z.string().describe("The MIME type of the file (e.g., 'application/pdf')."),
});

export type UploadFileInput = z.infer<typeof UploadFileInputSchema>;

const UploadFileOutputSchema = z.object({
  downloadUrl: z.string().describe('The public URL to access the uploaded file.'),
});

export type UploadFileOutput = z.infer<typeof UploadFileOutputSchema>;


export const uploadFileFlow = ai.defineFlow(
  {
    name: 'uploadFileFlow',
    inputSchema: UploadFileInputSchema,
    outputSchema: UploadFileOutputSchema,
  },
  async (input) => {
    const app = initializeFirebaseOnServer();
    const storage = getStorage(app);
    const bucket = storage.bucket(firebaseConfig.storageBucket);

    const { fileData, filePath, fileType } = input;
    
    // The incoming fileData is a data URL: 'data:mime/type;base64,xxxxxxxx'
    // We need to strip the prefix to get just the base64 data.
    const base64Data = fileData.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid file data format. Expected a Base64 data URL.');
    }
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
  }
);

export async function uploadFile(input: UploadFileInput): Promise<UploadFileOutput> {
    return uploadFileFlow(input);
}
