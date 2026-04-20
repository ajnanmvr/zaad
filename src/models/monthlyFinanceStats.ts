import mongoose, { Schema, type Model } from "mongoose";

type PaymentMethodStat = {
  methodId: string;
  methodLabel: string;
  income: number;
  expense: number;
  balance: number;
};

type OfficeRecordCategoryStat = {
  categoryId: string;
  categoryLabel: string;
  income: number;
  expense: number;
  balance: number;
};

const PaymentMethodStatSchema = new Schema(
  {
    methodId: {
      type: String,
      required: true,
    },
    methodLabel: {
      type: String,
      required: true,
    },
    income: {
      type: Number,
      default: 0,
    },
    expense: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const OfficeRecordCategoryStatSchema = new Schema(
  {
    categoryId: {
      type: String,
      required: true,
    },
    categoryLabel: {
      type: String,
      required: true,
    },
    income: {
      type: Number,
      default: 0,
    },
    expense: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const MonthlyFinanceStatsSchema = new Schema(
  {
    year: {
      type: Number,
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true,
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    officeRecords: {
      totalIncome: {
        type: Number,
        default: 0,
      },
      totalExpense: {
        type: Number,
        default: 0,
      },
      byCategory: [OfficeRecordCategoryStatSchema],
    },
    profit: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    paymentMethods: [PaymentMethodStatSchema],
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
    collection: "monthly_finance_stats",
  },
);

// Compound index for year + month
MonthlyFinanceStatsSchema.index({ year: 1, month: 1 }, { unique: true });

const MonthlyFinanceStats: Model<any> =
  process.env.NODE_ENV === "development"
    ? (() => {
        if (mongoose.models.MonthlyFinanceStats) {
          delete mongoose.models.MonthlyFinanceStats;
        }
        return mongoose.model("MonthlyFinanceStats", MonthlyFinanceStatsSchema) as Model<any>;
      })()
    : (mongoose.models.MonthlyFinanceStats as Model<any>) ||
      (mongoose.model("MonthlyFinanceStats", MonthlyFinanceStatsSchema) as Model<any>);

export default MonthlyFinanceStats;
export type { PaymentMethodStat, OfficeRecordCategoryStat };
