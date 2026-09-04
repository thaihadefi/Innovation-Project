import slugifyLib from "slugify";

export const slugify = (text: string): string => {
  if (!text) return "";
  
  return slugifyLib(text, {
    lower: true,
    strict: true,
    locale: 'vi'
  });
};
