import { URLSearchParams } from "url";

export function filterData(
  searchParams: URLSearchParams,
  considerStart: boolean
): any {
  const currentMonth = new Date().getMonth() + 1; // Months are zero-based, so add 1
  const currentYear = new Date().getFullYear();

  const monthParam = searchParams.get("m");
  const yearParam = searchParams.get("y");

  let filter: any = {
    published: true,
    method: { $ne: "liability" },
  };

  if (yearParam) {
    const year = parseInt(yearParam, 10);

    if (monthParam) {
      let month: number;
      if (monthParam === "current") {
        month = currentMonth;
      } else {
        month = parseInt(monthParam, 10);
      }
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1); // First day of the next month
      filter.createdAt = {
        $lt: endDate,
      };
      if (considerStart) {
        filter.createdAt.$gte = startDate;
      }
    } else {
      const startDate = new Date(year, 0, 1); // January 1st of the year
      const endDate = new Date(year + 1, 0, 1); // January 1st of the next year
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
    const startDate = new Date(currentYear, month - 1, 1);
    const endDate = new Date(currentYear, month, 1); // First day of the next month
    filter.createdAt = {
      $lt: endDate,
    };
    if (considerStart) {
      filter.createdAt.$gte = startDate;
    }
  }

  return filter;
}
