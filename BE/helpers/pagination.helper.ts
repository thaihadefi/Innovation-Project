export interface PaginationDTO {
  totalRecord: number;
  totalPage: number;
  currentPage: number;
  pageSize: number;
}

export const parsePage = (raw: unknown): number => {
  const parsed = parseInt(String(raw ?? "1"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export const parsePageSize = (raw: unknown, fallback: number, max: number): number => {
  const parsed = parseInt(String(raw ?? ""), 10);
  const size = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  return Math.min(size, max);
};

export const buildPagination = (total: number, page: number, pageSize: number): PaginationDTO => ({
  totalRecord: total,
  totalPage: Math.max(1, Math.ceil(total / pageSize)),
  currentPage: page,
  pageSize,
});
