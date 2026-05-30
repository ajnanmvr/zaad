import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const DUBAI_TIME_ZONE = "Asia/Dubai";

function isValidDate(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime());
}

function asDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

export function getDubaiNow() {
  return toZonedTime(new Date(), DUBAI_TIME_ZONE);
}

export function getDubaiCurrentYearMonth() {
  const dubaiNow = getDubaiNow();
  return {
    year: dubaiNow.getFullYear(),
    month: dubaiNow.getMonth() + 1,
  };
}

export function getDubaiDateParts(value: Date | string | number = new Date()) {
  const dubaiDate = toZonedTime(asDate(value), DUBAI_TIME_ZONE);
  return {
    year: dubaiDate.getFullYear(),
    month: dubaiDate.getMonth() + 1,
    day: dubaiDate.getDate(),
  };
}

export function getDubaiMonthRange(year: number, month: number) {
  const pad2 = (value: number) => String(value).padStart(2, "0");
  const monthStart = fromZonedTime(`${year}-${pad2(month)}-01T00:00:00`, DUBAI_TIME_ZONE);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const monthEnd = fromZonedTime(`${nextYear}-${pad2(nextMonth)}-01T00:00:00`, DUBAI_TIME_ZONE);

  return { monthStart, monthEnd };
}

export function formatDubaiDate(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
) {
  if (!value || !isValidDate(value)) return "---";

  return new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: DUBAI_TIME_ZONE,
  }).format(asDate(value));
}

export function formatDubaiDateTime(value: Date | string | number | null | undefined) {
  if (!value || !isValidDate(value)) return "---";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DUBAI_TIME_ZONE,
  }).format(asDate(value));
}

export function formatDubaiMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: DUBAI_TIME_ZONE,
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}