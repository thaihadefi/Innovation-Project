import type { FilterQuery, Model } from "mongoose";

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

interface PaginateOptions {
  page: number;
  pageSize: number;
  projection?: string;
  sort?: Record<string, 1 | -1>;
}

/**
 * Runs the count + paginated lean find that every list endpoint repeats:
 * one round-trip for the total, one for the page, then a PaginationDTO.
 */
export const paginateQuery = async <T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  { page, pageSize, projection, sort = { createdAt: -1 } }: PaginateOptions
): Promise<{ items: T[]; pagination: PaginationDTO }> => {
  const skip = (page - 1) * pageSize;
  const [total, items] = await Promise.all([
    model.countDocuments(filter),
    model.find(filter).select(projection ?? "").sort(sort).skip(skip).limit(pageSize).lean<T[]>(),
  ]);
  return { items, pagination: buildPagination(total, page, pageSize) };
};
