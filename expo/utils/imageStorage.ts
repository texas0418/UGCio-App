import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

const IMAGES_SUBDIR = "images";

function imagesDir(): string {
  return `${FileSystem.documentDirectory}${IMAGES_SUBDIR}/`;
}

async function ensureImagesDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(imagesDir());
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(imagesDir(), { intermediates: true });
  }
}

/**
 * Copy a picked image into permanent document storage and return its new URI.
 * Image-picker results live in the app's cache container, which iOS purges
 * under storage pressure — persisting only the cache URI loses the image.
 * Returns the original URI on web, for remote URLs, or if the copy fails.
 */
export async function persistImage(uri: string, prefix: string): Promise<string> {
  if (Platform.OS === "web" || !uri || !uri.startsWith("file://")) return uri;
  if (!FileSystem.documentDirectory) return uri;
  if (uri.startsWith(imagesDir())) return uri;
  try {
    await ensureImagesDir();
    const ext = uri.split(".").pop()?.toLowerCase() || "jpg";
    const dest = `${imagesDir()}${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return uri;
  }
}

/**
 * Resolve a stored image URI to the current app container. iOS assigns a new
 * container path on every app update, so absolute file:// URIs go stale even
 * though files in Documents survive. If the stored URI is dead but a file with
 * the same basename exists in our images dir, return that instead.
 */
export async function resolveStoredImage(uri: string): Promise<string> {
  if (Platform.OS === "web" || !uri || !uri.startsWith("file://")) return uri;
  if (!FileSystem.documentDirectory) return uri;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) return uri;
    const name = uri.split("/").pop();
    if (name) {
      const candidate = `${imagesDir()}${name}`;
      if (candidate !== uri) {
        const alt = await FileSystem.getInfoAsync(candidate);
        if (alt.exists) return candidate;
      }
    }
  } catch {
    // fall through to the original URI
  }
  return uri;
}

/**
 * Rebase a stale container path, then move cache-resident images into
 * permanent storage. Used to migrate URIs persisted by older app versions.
 */
export async function migrateImageUri(uri: string, prefix: string): Promise<string> {
  const resolved = await resolveStoredImage(uri);
  return persistImage(resolved, prefix);
}
