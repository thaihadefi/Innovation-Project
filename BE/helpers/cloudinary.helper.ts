import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Queue from "bull";
import CloudinaryDeleteDeadletter from "../models/cloudinary-delete-deadletter.model";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CLOUDINARY_DELETE_QUEUE_ENABLED = process.env.CLOUDINARY_DELETE_QUEUE_ENABLED !== "false";

// Storage for images only (company logos, job images, profile photos)
export const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    resource_type: 'image',
    folder: 'images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  } as any,
});

// Storage for PDF documents only (CV files)
export const pdfStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    resource_type: 'raw', // 'raw' is for non-image files like PDFs
    folder: 'cvs',
    allowed_formats: ['pdf'],
  } as any,
});

// Legacy storage for backward compatibility (auto-detect resource type)
export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    resource_type: 'auto',
  } as any,
});

// Helper function to extract public_id from Cloudinary URL
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

    // Remove transformations before version marker (v123...)
    const versionIndex = segments.findIndex((s) => /^v\d+$/.test(s));
    const publicIdSegments = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments;
    if (publicIdSegments.length === 0) return null;

    // Drop extension from last segment only
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
      });
      attempts.push({ resourceType, result: result.result || "unknown" });

      // Idempotent delete: "ok" and "not found" are both terminal-success.
      if (result.result === "ok" || result.result === "not found") {
        return { ok: true, publicId, attempts };
      }
    } catch (error: any) {
      attempts.push({ resourceType, result: error?.message || "error" });
    }
  }

  return { ok: false, publicId, attempts };
};

type CloudinaryDeleteJobData = {
  imageUrl: string;
  publicId?: string;
  context?: string;
};

let cloudinaryDeleteQueue: Queue.Queue<CloudinaryDeleteJobData> | null = null;

if (CLOUDINARY_DELETE_QUEUE_ENABLED) {
  cloudinaryDeleteQueue = new Queue<CloudinaryDeleteJobData>("cloudinary-delete", REDIS_URL, {
    defaultJobOptions: {
      removeOnComplete: 200,
      removeOnFail: 100,
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  });

  cloudinaryDeleteQueue.process(async (job) => {
    const publicId = job.data.publicId || extractPublicId(job.data.imageUrl);
    if (!publicId) {
      throw new Error("Could not extract public_id from URL");
    }

    const result = await deleteByPublicId(publicId);
    if (!result.ok) {
      throw new Error(JSON.stringify(result.attempts));
    }

    return result;
  });

  cloudinaryDeleteQueue.on("failed", async (job, err) => {
    if (!job) return;
    const maxAttempts = typeof job.opts.attempts === "number" ? job.opts.attempts : 1;
    if (job.attemptsMade < maxAttempts) return;

    try {
      await CloudinaryDeleteDeadletter.create({
        imageUrl: job.data.imageUrl,
        publicId: job.data.publicId || extractPublicId(job.data.imageUrl) || "",
        context: job.data.context || "",
        attempts: job.attemptsMade,
        lastError: err?.message || "unknown error",
        attemptsLog: [],
      });
      console.error("[CloudinaryQueue] Job moved to dead-letter:", {
        imageUrl: job.data.imageUrl,
        attempts: job.attemptsMade,
      });
    } catch (persistError: any) {
      console.error("[CloudinaryQueue] Failed to persist dead-letter:", persistError?.message);
    }
  });

  cloudinaryDeleteQueue.on("error", (err) => {
    console.error("[CloudinaryQueue] Redis connection error:", err.message);
  });

  console.log("[CloudinaryQueue] Delete queue initialized with Redis");
}

export const queueDeleteImage = async (imageUrl: string, context = ""): Promise<boolean> => {
  if (!cloudinaryDeleteQueue) {
    return false;
  }
  if (!imageUrl) return false;

  try {
    const publicId = extractPublicId(imageUrl) || undefined;
    await cloudinaryDeleteQueue.add({
      imageUrl,
      publicId,
      context,
    });
    return true;
  } catch (error: any) {
    console.error("[CloudinaryQueue] Failed to enqueue delete job:", {
      imageUrl,
      context,
      error: error?.message || "unknown error",
    });
    return false;
  }
};

// Function to delete image from Cloudinary
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  const publicId = extractPublicId(imageUrl);
  
  if (!publicId) {
    console.log("[Cloudinary] Could not extract public_id from URL:", imageUrl);
    return false;
  }

  try {
    const result = await deleteByPublicId(publicId);
    if (!result.ok) {
      console.log("[Cloudinary] Delete failed, queueing retry:", result);
      const queued = await queueDeleteImage(imageUrl, "direct-delete-fallback");
      if (queued) {
        return true;
      }
    }
    return result.ok;
  } catch (error) {
    console.log("[Cloudinary] Error deleting from Cloudinary, queueing retry:", error);
    const queued = await queueDeleteImage(imageUrl, "direct-delete-exception");
    if (queued) {
      return true;
    }
    return false;
  }
};

// Best-effort batch delete with per-item observability.
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

export const closeCloudinaryDeleteQueue = async () => {
  if (!cloudinaryDeleteQueue) return;
  await cloudinaryDeleteQueue.close();
};
