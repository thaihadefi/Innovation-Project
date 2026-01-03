/**
 * Format date to dd/mm/yyyy (Vietnamese format)
 * @param date - Date string or Date object
 * @returns Formatted date string in dd/mm/yyyy format
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit", 
    year: "numeric"
  });
};

/**
 * Format date with time
 * @param date - Date string or Date object
 * @returns Formatted date string with time in dd/mm/yyyy HH:mm format
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

/**
 * Format relative time (e.g., "2 days ago")
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  
  return formatDate(d);
};
