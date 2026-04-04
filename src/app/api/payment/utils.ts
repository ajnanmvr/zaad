import { format, toZonedTime } from "date-fns-tz";

const DUBAI_TIME_ZONE = "Asia/Dubai";

export const PAYMENT_POPULATE_FIELDS = ["createdBy", "company", "employee"];

export function getRecordClient(record: any) {
  const company = record?.company;
  const employee = record?.employee;
  const self = record?.self;

  if (company) {
    return { name: company.name, id: company._id, type: "company" as const };
  }

  if (employee) {
    const type = employee.entityType === "individual" ? "individual" : "employee";
    return { name: employee.name, id: employee._id, type: type as const };
  }

  if (self) {
    return { name: self, type: "self" as const };
  }

  return null;
}

export function mapRecordListItem(record: any) {
  const createdAtInDubai = toZonedTime(record.createdAt, DUBAI_TIME_ZONE);

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
    status: record.status,
    remarks: record.remarks,
    number: record.number,
    suffix: record.suffix,
    edited: record.edited,
    date: format(createdAtInDubai, "MMM-dd hh:mma", {
      timeZone: DUBAI_TIME_ZONE,
    }),
  };
}