export function normalizeSearchParams(searchParams: unknown): URLSearchParams {
  // If it's already a URLSearchParams (browser or Node global), return as-is
  if (typeof globalThis.URLSearchParams !== "undefined" && searchParams instanceof globalThis.URLSearchParams) {
    return searchParams as URLSearchParams;
  }

  // Handle string form like "m=5&y=2025"
  if (typeof searchParams === "string") return new URLSearchParams(searchParams);

  // Handle URLSearchParams-like objects passed from client (has get/toString)
  if (searchParams && typeof searchParams === "object") {
    const maybe = searchParams as { toString?: () => string };
    if (typeof maybe.toString === "function") {
      const str = maybe.toString();
      return new URLSearchParams(str);
    }
    // Fallback: plain object of key-values
    const usp = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams as Record<string, unknown>)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) usp.append(key, String(v));
      } else {
        usp.set(key, String(value));
      }
    }
    return usp;
  }
  return new URLSearchParams();
}

export function filterData(searchParams: unknown, considerStart: boolean): any {
  const params = normalizeSearchParams(searchParams);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Months are zero-based, so add 1
  const currentYear = currentDate.getFullYear();

  const monthParam = params.get("m");
  const yearParam = params.get("y");

  let filter: any = {
    published: true,
    method: { $ne: "liability" },
  };

  function convertToUAE(date: Date): Date {
    // Adjust the date to the UAE timezone (UTC+4)
    const offset = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    return new Date(date.getTime() + offset);
  }

  if (yearParam) {
    const year = parseInt(yearParam, 10);

    if (monthParam) {
      let month: number;
      if (monthParam === "current") {
        month = currentMonth;
      } else {
        month = parseInt(monthParam, 10);
      }
      const startDate = convertToUAE(new Date(year, month - 1, 1));
      const endDate = convertToUAE(new Date(year, month, 1)); // First day of the next month
      filter.createdAt = {
        $lt: endDate,
      };
      if (considerStart) {
        filter.createdAt.$gte = startDate;
      }
    } else {
      const startDate = convertToUAE(new Date(year, 0, 1)); // January 1st of the year
      const endDate = convertToUAE(new Date(year + 1, 0, 1)); // January 1st of the next year
      filter.createdAt = {
        $lt: endDate,
      };
      if (considerStart) {
        filter.createdAt.$gte = startDate;
      }
    }
  } else if (monthParam) {
    let month: number;
    if (monthParam === "current") {
      month = currentMonth;
    } else {
      month = parseInt(monthParam, 10);
    }
    const startDate = convertToUAE(new Date(currentYear, month - 1, 1));
    const endDate = convertToUAE(new Date(currentYear, month, 1)); // First day of the next month
    filter.createdAt = {
      $lt: endDate,
    };
    if (considerStart) {
      filter.createdAt.$gte = startDate;
    }
  }

  return filter;
}
