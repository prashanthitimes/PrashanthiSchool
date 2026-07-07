import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { Capacitor } from '@capacitor/core';
import { Toast } from '@capacitor/toast';

const ALBUM_NAME = 'Prashanthi Vidyalaya';

async function getOrCreateAlbum(): Promise<string> {
  const { albums } = await Media.getAlbums();
  const existing = albums.find(a => a.name === ALBUM_NAME);
  if (existing) return existing.identifier;

  await Media.createAlbum({ name: ALBUM_NAME });
  const { albums: refreshed } = await Media.getAlbums();
  const found = refreshed.find(a => a.name === ALBUM_NAME);
  if (!found) throw new Error('Failed to create or locate album');
  return found.identifier;
}

export async function saveImageFromDataUrl(dataUrl: string, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    const base64Data = dataUrl.split(',')[1];

    const tempFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    const albumIdentifier = await getOrCreateAlbum();

    await Media.savePhoto({
      path: tempFile.uri,
      albumIdentifier,
    });

    await Toast.show({
      text: 'Downloaded ✓ Saved to gallery',
      duration: 'short',
      position: 'bottom',
    });
  } else {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  }
}

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

    const albumIdentifier = await getOrCreateAlbum();

    await Media.savePhoto({
      path: tempFile.uri,
      albumIdentifier,
    });

    await Toast.show({
      text: 'Downloaded ✓ Saved to gallery',
      duration: 'short',
      position: 'bottom',
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