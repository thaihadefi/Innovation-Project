import slugify from "slugify";

export const convertToSlug = (text: string): string => {
  if (!text) return "";

  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'vi'
  });
};

export const generateUniqueSlug = (text: string, id?: string): string => {
  const baseSlug = convertToSlug(text);
  
  if (id) {
    const shortId = id.slice(-6);
    return `${baseSlug}-${shortId}`;
  }
  
  return baseSlug;
};
