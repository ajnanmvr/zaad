export const PAGINATION = {
  DEFAULT_PAGE: 1,
  LIMITS: {
    ENTITY_LIST: 10,
    EXPIRY_DOCUMENTS: 20,
    USER_ACTIVITY: 10,
    USER_LIST: 10,
  },
} as const;

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number
) {
  const page = Number(
    searchParams.get("page") || String(PAGINATION.DEFAULT_PAGE)
  );
  const limit = Number(searchParams.get("limit") || String(defaultLimit));

  return {
    page: Math.max(page, PAGINATION.DEFAULT_PAGE),
    limit: Math.max(limit, 1),
  };
}
