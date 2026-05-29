import mongoose, { Schema, type Model } from "mongoose";

const OfficeRecordCategoryStatsSchema = new Schema(
  {
    categoryKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "officeExpenseCategories",
      index: true,
    },
    categoryLabel: {
      type: String,
      required: true,
      trim: true,
    },
    incomeTotal: {
      type: Number,
      default: 0,
    },
    incomeCount: {
      type: Number,
      default: 0,
    },
    expenseTotal: {
      type: Number,
      default: 0,
    },
    expenseCount: {
      type: Number,
      default: 0,
    },
    totalCount: {
      type: Number,
      default: 0,
    },
    lastRecomputedAt: {
      type: Date,
      default: Date.now,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "office_record_category_stats",
  },
);

const OfficeRecordCategoryStats: Model<any> =
  process.env.NODE_ENV === "development"
    ? (() => {
        if (mongoose.models.OfficeRecordCategoryStats) {
          delete mongoose.models.OfficeRecordCategoryStats;
        }
        return mongoose.model(
          "OfficeRecordCategoryStats",
          OfficeRecordCategoryStatsSchema,
        ) as Model<any>;
      })()
    : (mongoose.models.OfficeRecordCategoryStats as Model<any>) ||
      (mongoose.model(
        "OfficeRecordCategoryStats",
        OfficeRecordCategoryStatsSchema,
      ) as Model<any>);

export default OfficeRecordCategoryStats;
