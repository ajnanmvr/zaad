import { format, toZonedTime } from "date-fns-tz";

const DUBAI_TIME_ZONE = "Asia/Dubai";

export const PAYMENT_POPULATE_FIELDS = [
  "createdBy",
  "activityLog.by",
  "entity",
  "method",
  "status",
  "category",
];

export function getRecordClient(record: any) {
  const entity = record?.entity;

  if (entity) {
    const rawType = String(entity?.entityType || "").toLowerCase();
    const type =
      rawType === "individual"
        ? "individual"
        : rawType === "company"
          ? "company"
          : rawType === "employee"
            ? "employee"
            : "company";

    return {
      name: entity.name,
      id: entity._id,
      type,
      color: entity.color,
    };
  }

  if (String(record?.recordKind || "").toLowerCase() === "office_records") {
    return {
      name: "Office",
      id: "office",
      type: "office",
      color: "#0F766E",
    };
  }

  return null;
}

export function mapRecordListItem(record: any) {
  const createdAtInDubai = toZonedTime(record.createdAt, DUBAI_TIME_ZONE);
  const now = new Date();
  const diffInMs = now.getTime() - new Date(record.createdAt).getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const version = Number(record?.__v || 0);

  const relativeDate = (() => {
    if (diffInSeconds < 60) return `${Math.max(diffInSeconds, 0)} second${diffInSeconds === 1 ? "" : "s"} ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInDays < 30) return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInDays < 365) return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
  })();

  const dateTime = format(createdAtInDubai, "MMM-dd hh:mma", {
    timeZone: DUBAI_TIME_ZONE,
  });

  return {
    id: record._id,
    type: record.type,
    recordKind: record.recordKind || "standard",
    transferGroupId: record.transferGroupId || "",
    paymentMethodTemplate: record?.method?._id?.toString?.() || record?.method?.toString?.() || record?.paymentMethodTemplate?._id?.toString?.() || record?.paymentMethodTemplate?.toString?.() || "",
    paymentStatusTemplate: record?.status?._id?.toString?.() || record?.status?.toString?.() || record?.paymentStatusTemplate?._id?.toString?.() || record?.paymentStatusTemplate?.toString?.() || "",
    method: record?.method?.method || record?.paymentMethodTemplate?.method || "",
    status: record?.status?.status || record?.paymentStatusTemplate?.status || "",
    client: getRecordClient(record),
    particular: record.particular,
    category: record?.category?.category || (record?.recordKind === "office_records" ? "Office" : ""),
    // For office_records, always provide a category label fallback
    categoryName:
      record?.category?.category ||
      (record?.recordKind === "office_records" ? "Office" : ""),
    categoryColor: record?.category?.color || "",
    categoryIcon: record?.category?.icon || "",
    amount: record.amount?.toFixed(2),
    serviceFee: record.serviceFee?.toFixed(2),
    creator: record?.createdBy?.username,
    creatorFullname: record?.createdBy?.fullname,
    remarks: record.remarks,
    number: record.number,
    suffix: record.suffix,
    version,
    date: relativeDate,
    dateTime,
    createdAt: record.createdAt,
    deletedAt: record.deletedAt,
    activityLog: (record?.activityLog || []).map((entry: any) => ({
      action: entry.action,
      at: entry.at,
      byUsername: entry.byUsername || entry?.by?.username,
      byFullname: entry.byFullname || entry?.by?.fullname,
      details: entry.details,
      previousValues: entry.previousValues,
      newValues: entry.newValues,
    })),
  };
}