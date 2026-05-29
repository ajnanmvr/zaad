import mongoose, { Schema, type Model } from "mongoose";

const EntityRecordStatsSchema = new Schema(
  {
    entity: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      required: true,
      unique: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ["company", "employee", "individual"],
      index: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalIncome: {
      type: Number,
      default: 0,
    },
    totalExpense: {
      type: Number,
      default: 0,
    },
    totalServiceFee: {
      type: Number,
      default: 0,
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    lastRecomputedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "entity_record_stats",
  },
);

const EntityRecordStats: Model<any> =
  process.env.NODE_ENV === "development"
    ? (() => {
        if (mongoose.models.EntityRecordStats) {
          delete mongoose.models.EntityRecordStats;
        }
        return mongoose.model("EntityRecordStats", EntityRecordStatsSchema) as Model<any>;
      })()
    : (mongoose.models.EntityRecordStats as Model<any>) ||
      (mongoose.model("EntityRecordStats", EntityRecordStatsSchema) as Model<any>);

export default EntityRecordStats;
