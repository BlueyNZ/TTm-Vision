[import { useState } from 'react';
import { uploadFile } from '@/ai/flows/upload-file-flow';

interface UseFileUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadToStorage = async (
    file: File,
    filePath: string
  ): Promise<string | null> => {
    if (!file) return null;

    try {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      setProgress(50);

      // Upload to Firebase Storage via Genkit flow
      const result = await uploadFile({
        filePath,
        fileData: base64Data,
        fileName: file.name,
        fileType: file.type,
      });

      setProgress(100);
      options.onSuccess?.(result.downloadUrl);
      return result.downloadUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadToStorage,
    isUploading,
    progress,
    error,
  };
}
