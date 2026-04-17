import mongoose, { Model, Schema } from "mongoose";

const PaymentExpenseCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true, collection: "paymentExpenseCategories" }
);

PaymentExpenseCategorySchema.index({ name: 1 }, { unique: true });

const PaymentExpenseCategory =
  (mongoose.models.paymentExpenseCategories as Model<any>) ||
  mongoose.model("paymentExpenseCategories", PaymentExpenseCategorySchema);

export default PaymentExpenseCategory;
