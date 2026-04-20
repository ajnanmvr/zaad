import Records from "@/models/records";
import TaskNotification from "@/models/taskNotifications";
import Employee from "@/models/employees";
import Entity from "@/models/entities";
import EntityRecordStats from "@/models/entityRecordStats";
import PaymentTemplate from "@/models/paymentTemplates";
import PaymentStatusTemplate from "@/models/paymentStatusTemplates";
import mongoose from "mongoose";

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

export async function findPaymentTemplateById(id: string) {
  return PaymentTemplate.findById(id).select("_id method color icon published");
}

export async function findPaymentStatusTemplateById(id: string) {
  return PaymentStatusTemplate.findById(id).select("_id status color published");
}

export async function createPaymentEditNotification(data: any) {
  return TaskNotification.create(data);
}

export async function findPublishedEntityIds() {
  return Entity.find({
    published: true,
    entityType: { $in: ["company", "employee", "individual"] },
  })
    .select("_id")
    .lean();
}

export async function aggregateEntityRecordStatsByEntityIds(entityIds?: string[]) {
  const matchStage: Record<string, any> = {
    deletedAt: null,
    entity: { $ne: null },
    recordKind: { $ne: "liability" },
  };

  if (entityIds && entityIds.length > 0) {
    const objectIds = entityIds
      .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
      .map((id) => new mongoose.Types.ObjectId(String(id)));

    if (!objectIds.length) {
      return [];
    }

    matchStage.entity = { $in: objectIds };
  }

  return Records.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "entities",
        localField: "entity",
        foreignField: "_id",
        as: "entityDoc",
      },
    },
    { $unwind: "$entityDoc" },
    { $match: { "entityDoc.published": true } },
    {
      $group: {
        _id: "$entity",
        totalTransactions: { $sum: 1 },
        totalIncome: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, { $ifNull: ["$amount", 0] }, 0],
          },
        },
        totalExpense: {
          $sum: {
            $cond: [
              { $eq: ["$type", "expense"] },
              { $add: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$serviceFee", 0] }] },
              0,
            ],
          },
        },
      },
    },
  ]);
}

export async function bulkUpsertEntityRecordStats(statsRows: any[]) {
  if (!statsRows.length) {
    return null;
  }

  return EntityRecordStats.bulkWrite(
    statsRows.map((row) => ({
      updateOne: {
        filter: { entity: row.entity },
        update: {
          $set: {
            published: true,
            totalIncome: row.totalIncome,
            totalExpense: row.totalExpense,
            totalTransactions: row.totalTransactions,
            balance: row.balance,
            lastRecomputedAt: row.lastRecomputedAt || new Date(),
          },
        },
        upsert: true,
      },
    })),
  );
}

export async function findEntityRecordStatsByEntityIds(entityIds: string[]) {
  if (!entityIds.length) {
    return [];
  }

  return EntityRecordStats.find({ entity: { $in: entityIds }, published: true })
    .select("entity totalIncome totalExpense totalTransactions balance lastRecomputedAt")
    .lean();
}

export async function ensureEntityRecordStats(entityId: string) {
  return EntityRecordStats.findOneAndUpdate(
    { entity: entityId },
    {
      $setOnInsert: {
        entity: entityId,
        totalIncome: 0,
        totalExpense: 0,
        totalTransactions: 0,
        balance: 0,
        lastRecomputedAt: new Date(),
      },
      $set: {
        published: true,
      },
    },
    { upsert: true, new: true },
  );
}

export async function unpublishEntityRecordStats(entityId: string) {
  return EntityRecordStats.findOneAndUpdate(
    { entity: entityId },
    {
      $set: {
        published: false,
      },
    },
    { new: true },
  );
}
