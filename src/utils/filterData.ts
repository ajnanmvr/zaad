import { URLSearchParams } from "url";

export function filterData(searchParams: URLSearchParams, considerStart: boolean): any {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Months are zero-based, so add 1
  const currentYear = currentDate.getFullYear();

  const monthParam = searchParams.get("m");
  const yearParam = searchParams.get("y");

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
