import { logger } from "@features/utils/logger";

export type ImageUploader = (sourceUrl: string) => Promise<string | undefined>;

export function createImageUploader(bucket: R2Bucket, signal?: AbortSignal): ImageUploader {
  return async (sourceUrl: string) => {
    const photoId = crypto.randomUUID();
    const key = `photos/${photoId}.jpg`;
    const uploaded = await uploadImageToR2(bucket, sourceUrl, key, signal);
    return uploaded ? photoId : undefined;
  };
}

export function photoIdToUrl(photoId: string, publicBaseUrl: string): string {
  return `${publicBaseUrl}/photos/${photoId}.jpg`;
}

async function uploadImageToR2(
  bucket: R2Bucket,
  sourceUrl: string,
  key: string,
  signal?: AbortSignal
): Promise<boolean> {
  try {
    logger.log("[ImageStorage] Downloading image from '%s'...", sourceUrl);
    const response = await fetch(sourceUrl, { signal });
    if (!response.ok) {
      logger.error("[ImageStorage] Failed to download image. Status: %d", response.status);
      return false;
    } else {
      const contentType = response.headers.get("Content-Type") || "image/jpeg";
      const body = await response.arrayBuffer();

      logger.log("[ImageStorage] Uploading to R2 with key '%s' (%d bytes)...", key, body.byteLength);
      await bucket.put(key, body, {
        httpMetadata: { contentType }
      });

      logger.log("[ImageStorage] Uploaded successfully: key='%s'", key);
      return true;
    }
  } catch (error) {
    logger.error("[ImageStorage] Failed to upload image:", error);
    return false;
  }
}
