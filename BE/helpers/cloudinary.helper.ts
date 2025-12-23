import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
    // Cloudinary URL pattern: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{extension}
    // or for raw files: https://res.cloudinary.com/{cloud_name}/raw/upload/v{version}/{public_id}.{extension}
    const regex = /\/v\d+\/(.+?)(?:\.\w+)?$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.log("Error extracting public_id:", error);
    return null;
  }
};

// Function to delete image from Cloudinary
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  const publicId = extractPublicId(imageUrl);
  
  if (!publicId) {
    console.log("Could not extract public_id from URL:", imageUrl);
    return false;
  }

  try {
    // Try deleting as image first
    let result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    
    // If not found as image, try as raw (PDF)
    if (result.result === 'not found') {
      result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }
    
    console.log("Cloudinary delete result:", result);
    return result.result === "ok";
  } catch (error) {
    console.log("Error deleting from Cloudinary:", error);
    return false;
  }
};