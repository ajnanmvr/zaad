import { format, toZonedTime } from "date-fns-tz";

const DUBAI_TIME_ZONE = "Asia/Dubai";

export const PAYMENT_POPULATE_FIELDS = [
  "createdBy",
  "deletedBy",
  "activityLog.by",
  "company",
  "employee",
];

export function getRecordClient(record: any) {
  const company = record?.company;
  const employee = record?.employee;
  const self = record?.self;

  if (company) {
    return { name: company.name, id: company._id, type: "company" as const, color: company.color };
  }

  if (employee) {
    const type = employee.entityType === "individual" ? "individual" : "employee";
    return { name: employee.name, id: employee._id, type, color: employee.color };
  }

  if (self) {
    return { name: self, type: "self" as const };
  }

  return null;
}

export function mapRecordListItem(record: any) {
  const createdAtInDubai = toZonedTime(record.createdAt, DUBAI_TIME_ZONE);
  const now = new Date();
  const diffInMs = now.getTime() - new Date(record.createdAt).getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const latestUpdate = [...(record?.activityLog || [])].reverse().find((entry: any) => entry.action === "update");
  const editedFieldsCount = latestUpdate?.newValues ? Object.keys(latestUpdate.newValues).length : 0;

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
    client: getRecordClient(record),
    method: record.method,
    particular: record.particular,
    invoiceNo: record.invoiceNo,
    amount: record.amount?.toFixed(2),
    serviceFee: record.serviceFee?.toFixed(2),
    creator: record?.createdBy?.username,
    creatorFullname: record?.createdBy?.fullname,
    status: record.status,
    remarks: record.remarks,
    number: record.number,
    suffix: record.suffix,
    edited: record.edited,
    editedFieldsCount,
    date: relativeDate,
    dateTime,
    createdAt: record.createdAt,
    deletedAt: record.deletedAt,
    deletedBy: record?.deletedBy?.username,
    deletedByFullname: record?.deletedBy?.fullname,
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