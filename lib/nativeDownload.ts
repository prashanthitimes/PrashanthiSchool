import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { Capacitor } from '@capacitor/core';

/**
 * Saves a PNG (from a data URL, e.g. canvas.toDataURL()) directly to the
 * device's Photos/Gallery on Android, or triggers a browser download on web.
 */
export async function saveImageFromDataUrl(dataUrl: string, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    const base64Data = dataUrl.split(',')[1];

    // 1. Write to a temp file first — Media.savePhoto needs a real file URI,
    //    it does not reliably accept a raw base64 data URL.
    const tempFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    // 2. Copy that file into the gallery
    await Media.savePhoto({
      path: tempFile.uri,
    });
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
 */
export async function saveImageFromUrl(url: string, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64Data: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const tempFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Media.savePhoto({
      path: tempFile.uri,
    });
  } else {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  }
}