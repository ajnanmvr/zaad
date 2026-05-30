import { URLSearchParams } from "url";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { DUBAI_TIME_ZONE, getDubaiCurrentYearMonth } from "@/utils/dubaiTime";

export function filterData(searchParams: URLSearchParams, considerStart: boolean): any {
  const { month: currentMonth, year: currentYear } = getDubaiCurrentYearMonth();

  const monthParam = searchParams.get("m");
  const yearParam = searchParams.get("y");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  let filter: any = {
    published: true,
    recordKind: { $ne: "liability" },
  };

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
    const fromDate = fromParam ? fromZonedTime(`${fromParam}T00:00:00`, DUBAI_TIME_ZONE) : undefined;
    const toDate = toParam ? fromZonedTime(`${toParam}T00:00:00`, DUBAI_TIME_ZONE) : undefined;

    const nextDay = toDate
      ? fromZonedTime(
          `${toDate.getFullYear()}-${String(toDate.getMonth() + 1).padStart(2, "0")}-${String(toDate.getDate() + 1).padStart(2, "0")}T00:00:00`,
          DUBAI_TIME_ZONE,
        )
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
      const startDate = fromZonedTime(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`, DUBAI_TIME_ZONE);
      const endDate = fromZonedTime(
        `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01T00:00:00`,
        DUBAI_TIME_ZONE,
      );
      applyDateRange(startDate, endDate);
    } else {
      const startDate = fromZonedTime(`${year}-01-01T00:00:00`, DUBAI_TIME_ZONE);
      const endDate = fromZonedTime(`${year + 1}-01-01T00:00:00`, DUBAI_TIME_ZONE);
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
    const startDate = fromZonedTime(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`, DUBAI_TIME_ZONE);
    const endDate = fromZonedTime(
      `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01T00:00:00`,
      DUBAI_TIME_ZONE,
    );
    applyDateRange(startDate, endDate);
  } else {
    const startDate = fromZonedTime(`${currentYear}-${String(currentMonth).padStart(2, "0")}-01T00:00:00`, DUBAI_TIME_ZONE);
    const endDate = fromZonedTime(
      `${currentMonth === 12 ? currentYear + 1 : currentYear}-${String(currentMonth === 12 ? 1 : currentMonth + 1).padStart(2, "0")}-01T00:00:00`,
      DUBAI_TIME_ZONE,
    );
    applyDateRange(startDate, endDate);
  }

  return filter;
}
