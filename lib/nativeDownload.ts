import { Media } from '@capacitor-community/media';
import { Capacitor } from '@capacitor/core';

/**
 * Saves a PNG (from a data URL, e.g. canvas.toDataURL()) directly to the
 * device's Photos/Gallery on Android, or triggers a browser download on web.
 */
export async function saveImageFromDataUrl(dataUrl: string, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      await Media.savePhoto({
        path: dataUrl, // accepts base64 data URL directly
        fileName,
      });
    } catch (err) {
      console.error('Failed to save image to gallery:', err);
      throw err;
    }
  } else {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  }
}

/**
 * Saves a remote image (fetched by URL) directly to the device's
 * Photos/Gallery on Android, or triggers a browser download on web.
 * Used for gallery photos.
 */
export async function saveImageFromUrl(url: string, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const base64Data: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      await Media.savePhoto({
        path: base64Data, // full data URL string works here too
        fileName,
      });
    } catch (err) {
      console.error('Failed to save image to gallery:', err);
      throw err;
    }
  } else {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  }
}