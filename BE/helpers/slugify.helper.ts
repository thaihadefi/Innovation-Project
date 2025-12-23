import slugify from "slugify";

// Helper function to convert Vietnamese text to slug using slugify library
export const convertToSlug = (text: string): string => {
  if (!text) return "";

  return slugify(text, {
    lower: true,      // Convert to lowercase
    strict: true,     // Strip special characters
    locale: 'vi'      // Vietnamese locale
  });
};

// Generate unique slug with timestamp or counter if needed
export const generateUniqueSlug = (text: string, id?: string): string => {
  const baseSlug = convertToSlug(text);
  
  if (id) {
    // Add short ID suffix for uniqueness (last 6 chars of MongoDB ObjectId)
    const shortId = id.slice(-6);
    return `${baseSlug}-${shortId}`;
  }
  
  return baseSlug;
};
