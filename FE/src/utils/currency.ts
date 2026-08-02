export const formatCurrencyVN = (n: number): string => n.toLocaleString("vi-VN");

export const formatSalaryRangeVN = (min?: number | null, max?: number | null): string => {
  if (!min && !max) return "Negotiable";
  if (min && max) return `${formatCurrencyVN(min)} – ${formatCurrencyVN(max)} VND`;
  if (min) return `From ${formatCurrencyVN(min)} VND`;
  return `Up to ${formatCurrencyVN(max as number)} VND`;
};
