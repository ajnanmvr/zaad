import mongoose, { Model, Schema } from "mongoose";

const OfficeExpenseCategorySchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      uppercase: true,
    },
    icon: {
      type: String,
      trim: true,
      default: "briefcase",
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "officeExpenseCategories" },
);

OfficeExpenseCategorySchema.index({ category: 1 }, { unique: true });

const OfficeExpenseCategory =
  (mongoose.models.officeExpenseCategories as Model<any>) ||
  mongoose.model("officeExpenseCategories", OfficeExpenseCategorySchema);

export default OfficeExpenseCategory;
