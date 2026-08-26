import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async () => ({
    resource_type: "image",
    folder: "images",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
  }),
});

export const pdfStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async () => ({
    resource_type: "raw",
    folder: "cvs",
    allowed_formats: ["pdf"],
  }),
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async () => ({
    resource_type: "auto",
  }),
});

export const extractPublicId = (url: string): string | null => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const uploadMarker = "/upload/";
    const markerIndex = parsed.pathname.indexOf(uploadMarker);
    if (markerIndex === -1) return null;

    const afterUpload = parsed.pathname.slice(markerIndex + uploadMarker.length);
    const segments = afterUpload.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    const versionIndex = segments.findIndex((s) => /^v\d+$/.test(s));
    const publicIdSegments = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments;
    if (publicIdSegments.length === 0) return null;

    const last = publicIdSegments[publicIdSegments.length - 1];
    publicIdSegments[publicIdSegments.length - 1] = last.replace(/\.[^.]+$/, "");

    return publicIdSegments.join("/");
  } catch (error) {
    console.log("[Cloudinary] Error extracting public_id:", error);
    return null;
  }
};

type DeleteAttempt = {
  resourceType: "image" | "raw" | "video";
  result: string;
};

type DeleteResult = {
  ok: boolean;
  publicId: string | null;
  attempts: DeleteAttempt[];
};

const deleteByPublicId = async (publicId: string): Promise<DeleteResult> => {
  const attempts: DeleteAttempt[] = [];
  const resourceTypes: Array<"image" | "raw" | "video"> = ["image", "raw", "video"];

  for (const resourceType of resourceTypes) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      }) as { result?: string };
      attempts.push({ resourceType, result: result.result || "unknown" });

      if (result.result === "ok" || result.result === "not found") {
        return { ok: true, publicId, attempts };
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      attempts.push({ resourceType, result: err?.message || "error" });
    }
  }

  return { ok: false, publicId, attempts };
};

export const queueDeleteImage = async (_imageUrl: string, _context = ""): Promise<boolean> => false;

export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  const publicId = extractPublicId(imageUrl);

  if (!publicId) {
    console.log("[Cloudinary] Could not extract public_id from URL:", imageUrl);
    return false;
  }

  try {
    const result = await deleteByPublicId(publicId);

    if (!result.ok) {
      console.error("[Cloudinary] Delete failed:", result);
      return false;
    }

    return true;
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Cloudinary] Unexpected error deleting image:", err?.message || error);
    return false;
  }
};

export const deleteImages = async (urls: string[]): Promise<{ total: number; success: number; failed: string[] }> => {
  const uniqueUrls = Array.from(new Set((urls || []).filter(Boolean)));
  if (uniqueUrls.length === 0) {
    return { total: 0, success: 0, failed: [] };
  }

  const settled = await Promise.allSettled(uniqueUrls.map((url) => deleteImage(url)));
  const failed: string[] = [];
  let success = 0;

  settled.forEach((item, index) => {
    if (item.status === "fulfilled" && item.value) {
      success += 1;
    } else {
      failed.push(uniqueUrls[index]);
    }
  });

  if (failed.length > 0) {
    console.log("[Cloudinary] Batch delete partial failure:", {
      total: uniqueUrls.length,
      success,
      failedCount: failed.length,
      failed,
    });
  }

  return { total: uniqueUrls.length, success, failed };
};

export const cleanupReplacedMedia = (
  oldUrl?: string | null,
  newFilePath?: string,
  explicitClear = false
): void => {
  if (!oldUrl) return;
  const isReplaced = !!newFilePath && oldUrl !== newFilePath;
  const isRemoved = !newFilePath && explicitClear;
  if (isReplaced || isRemoved) {
    void deleteImage(oldUrl).catch((err) =>
      console.error("[Cloudinary] Failed to delete replaced media:", err)
    );
  }
};
