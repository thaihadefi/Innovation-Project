import slugifyLib from "slugify";

/**
 * Slugify utility with Vietnamese locale support
 * @param text - Text to slugify
 * @returns Slugified string
 */
export const slugify = (text: string): string => {
  if (!text) return "";
  
  return slugifyLib(text, {
    lower: true,      // Convert to lowercase
    strict: true,     // Strip special characters
    locale: 'vi'      // Vietnamese locale
  });
};
