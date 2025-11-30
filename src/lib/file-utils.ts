/**
 * Convert a base64 data URL to a Blob URL that can be opened in a new tab
 * @param dataUrl - The base64 data URL (e.g., "data:application/pdf;base64,...")
 * @returns A blob URL that can be used with window.open()
 * 
 * Base64 to Blob conversion pattern adapted from:
 * https://github.com/EsriJapan/arcgis-webappbuilder-widgets-themes
 * Licensed under Apache 2.0
 */
export function dataUrlToBlobUrl(dataUrl: string): string {
  // Extract the base64 data and MIME type
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const base64Data = parts[1];

  // Convert base64 to binary
  const byteString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  // Create a Blob and return its URL
  const blob = new Blob([arrayBuffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Open a file in a new tab by converting data URL to Blob URL
 * @param dataUrl - The base64 data URL
 */
export function openFileInNewTab(dataUrl: string): void {
  try {
    const blobUrl = dataUrlToBlobUrl(dataUrl);
    window.open(blobUrl, '_blank');
  } catch (error) {
    console.error('Error opening file:', error);
    alert('Could not open file. Please try downloading it instead.');
  }
}
