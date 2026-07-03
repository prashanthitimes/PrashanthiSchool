import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Saves a PNG (from a data URL, e.g. canvas.toDataURL()) either via
 * browser download (web) or native Filesystem + Share sheet (APK).
 */
export async function saveImageFromDataUrl(dataUrl: string, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    const base64Data = dataUrl.split(",")[1];
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });
    await Share.share({
      title: fileName,
      text: "Official Document",
      url: savedFile.uri,
      dialogTitle: "Save or Share",
    });
  } else {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  }
}

/**
 * Saves a remote image (fetched by URL) either via browser download (web)
 * or native Filesystem + Share sheet (APK). Used for gallery photos.
 */
export async function saveImageFromUrl(url: string, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64Data: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });
    await Share.share({
      title: fileName,
      text: "School Gallery Photo",
      url: savedFile.uri,
      dialogTitle: "Save or Share Photo",
    });
  } else {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  }
}