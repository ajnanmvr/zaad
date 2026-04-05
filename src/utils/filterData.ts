import { URLSearchParams } from "url";

export function filterData(searchParams: URLSearchParams, considerStart: boolean): any {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const monthParam = searchParams.get("m");
  const yearParam = searchParams.get("y");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  let filter: any = {
    published: true,
    status: { $not: /^liability$/i },
  };

  function convertToUAE(date: Date): Date {
    const offset = 4 * 60 * 60 * 1000;
    return new Date(date.getTime() + offset);
  }

  const applyDateRange = (startDate?: Date, endDate?: Date) => {
    const createdAt: { $gte?: Date; $lt?: Date } = {};
    if (startDate && considerStart) {
      createdAt.$gte = startDate;
    }
    if (endDate) {
      createdAt.$lt = endDate;
    }
    if (createdAt.$gte || createdAt.$lt) {
      filter.createdAt = createdAt;
    }
  };

  if (fromParam || toParam) {
    const fromDate = fromParam ? convertToUAE(new Date(`${fromParam}T00:00:00`)) : undefined;
    const toDate = toParam ? convertToUAE(new Date(`${toParam}T00:00:00`)) : undefined;

    const nextDay = toDate
      ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1)
      : undefined;

    applyDateRange(fromDate, nextDay);
    return filter;
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
      const endDate = convertToUAE(new Date(year, month, 1));
      applyDateRange(startDate, endDate);
    } else {
      const startDate = convertToUAE(new Date(year, 0, 1));
      const endDate = convertToUAE(new Date(year + 1, 0, 1));
      applyDateRange(startDate, endDate);
    }
  } else if (monthParam) {
    let month: number;
    if (monthParam === "current") {
      month = currentMonth;
    } else {
      month = parseInt(monthParam, 10);
    }
    const year = yearParam ? parseInt(yearParam, 10) : currentYear;
    const startDate = convertToUAE(new Date(year, month - 1, 1));
    const endDate = convertToUAE(new Date(year, month, 1));
    applyDateRange(startDate, endDate);
  } else {
    const startDate = convertToUAE(new Date(currentYear, currentMonth - 1, 1));
    const endDate = convertToUAE(new Date(currentYear, currentMonth, 1));
    applyDateRange(startDate, endDate);
  }

  return filter;
}
