import slugifyLib from "slugify";

// Slugify utility using the slugify library
export const slugify = (text: string): string => {
  if (!text) return "";
  
  return slugifyLib(text, {
    lower: true,      // Convert to lowercase
    strict: true,     // Strip special characters
    locale: 'vi'      // Vietnamese locale
  });
};
