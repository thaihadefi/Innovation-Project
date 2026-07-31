// Shape of the `pagination` object returned by every paginated BE endpoint.
export type PaginationMeta = {
  totalRecord: number;
  totalPage: number;
  currentPage: number;
  pageSize: number;
};
