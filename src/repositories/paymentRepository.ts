import Records from "@/models/records";
import TaskNotification from "@/models/taskNotifications";
import Employee from "@/models/employees";
import Entity from "@/models/entities";
import PaymentTemplate from "@/models/paymentTemplates";
import PaymentStatusTemplate from "@/models/paymentStatusTemplates";

type TFindRecordsOptions = {
  populate?: any;
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
  select?: string;
  lean?: boolean;
};

export async function createRecord(data: any) {
  return Records.create(data);
}

export async function findRecordById(id: string) {
  return Records.findById(id);
}

export async function findRecordByIdLean(id: string) {
  return Records.findById(id).lean<any>();
}

export async function findRecordByIdAndPopulate(id: string, populate: any) {
  return Records.findById(id).populate(populate);
}

export async function findOneRecord(query: any, select?: string, sort?: Record<string, 1 | -1>) {
  let cursor = Records.findOne(query);
  if (sort) {
    cursor = cursor.sort(sort);
  }
  if (select) {
    cursor = cursor.select(select);
  }
  return cursor;
}

export async function findRecords(query: any, options?: TFindRecordsOptions) {
  let cursor: any = Records.find(query);

  if (options?.populate) {
    cursor = cursor.populate(options.populate);
  }
  if (options?.sort) {
    cursor = cursor.sort(options.sort);
  }
  if (typeof options?.skip === "number") {
    cursor = cursor.skip(options.skip);
  }
  if (typeof options?.limit === "number") {
    cursor = cursor.limit(options.limit);
  }
  if (options?.select) {
    cursor = cursor.select(options.select);
  }
  if (options?.lean) {
    cursor = cursor.lean();
  }

  return cursor;
}

export async function updateRecordById(id: string, update: any, options?: any) {
  return Records.findByIdAndUpdate(id, update, options);
}

export async function updateManyRecords(filter: any, update: any) {
  return Records.updateMany(filter, update);
}

export async function aggregateRecords<T = any>(pipeline: any[]) {
  return Records.aggregate<T>(pipeline);
}

export async function distinctEmployeeIdsByCompany(companyId: string) {
  return Employee.find({ published: true, company: companyId }).distinct("_id");
}

export async function findEntitiesByIds(ids: any[]) {
  return Entity.find({
    _id: { $in: ids },
    published: true,
    entityType: { $in: ["company", "employee", "individual"] },
  })
    .select("_id name entityType")
    .lean();
}

export async function findPaymentTemplateMethods() {
  return PaymentTemplate.find({ published: { $ne: false } })
    .select("_id method")
    .sort({ method: 1 });
}

export async function findPaymentStatusTemplates() {
  return PaymentStatusTemplate.find({ published: { $ne: false } })
    .select("_id status")
    .sort({ status: 1 });
}

export async function findPaymentTemplateByMethodName(method: string) {
  return PaymentTemplate.findOne({ method: new RegExp(`^${String(method || "").trim()}$`, "i") })
    .select("_id method");
}

export async function findPaymentStatusTemplateByStatusName(status: string) {
  return PaymentStatusTemplate.findOne({ status: new RegExp(`^${String(status || "").trim()}$`, "i") })
    .select("_id status");
}

export async function createPaymentEditNotification(data: any) {
  return TaskNotification.create(data);
}
