/**
 * Pagination Utilities
 * Shared pagination logic and helpers
 */

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string | null;
  showDeleted?: boolean;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CursorPaginationResult<T> {
  data: T[];
  hasMore: boolean;
  count: number;
}

/**
 * Calculate pagination offset
 */
export const calculateOffset = (page: number, limit: number): number => {
  return page * limit;
};

/**
 * Calculate total pages
 */
export const calculateTotalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};

/**
 * Check if more results available
 */
export const hasMoreResults = (page: number, limit: number, total: number): boolean => {
  return (page + 1) * limit < total;
};

/**
 * Build pagination metadata
 */
export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number
): {
  currentPage: number;
  totalPages: number;
  total: number;
  hasMore: boolean;
} => ({
  currentPage: page,
  totalPages: calculateTotalPages(total, limit),
  total,
  hasMore: hasMoreResults(page, limit, total),
});

/**
 * Slice data for cursor pagination
 */
export const sliceCursorData = <T>(data: T[], limit: number): { data: T[]; hasMore: boolean } => {
  const hasMore = data.length > limit;
  return {
    data: data.slice(0, limit),
    hasMore,
  };
};

/**
 * Build search filter with multiple fields
 */
export const buildSearchFilter = (search: string | null, fields: string[]): Record<string, any> | null => {
  if (!search) return null;
  return {
    $or: fields.map((field) => ({
      [field]: { $regex: search, $options: "i" },
    })),
  };
};

/**
 * Build query with optional search
 */
export const buildQuery = (published: boolean = true, search: string | null = null, fields: string[] = []): Record<string, any> => {
  const query: Record<string, any> = { published };
  const searchFilter = buildSearchFilter(search, fields);
  if (searchFilter) {
    query.$or = searchFilter.$or;
  }
  return query;
};
