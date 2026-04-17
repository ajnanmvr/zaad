import mongoose, { Model, Schema } from "mongoose";

const PaymentParticularTemplateSchema = new Schema(
  {
    particular: {
      type: String,
      required: true,
      trim: true,
    },
    appliesTo: {
      type: String,
      enum: ["income", "expense", "both"],
      default: "both",
      index: true,
    },
    entityType: {
      type: String,
      enum: ["company", "employee", "individual", "self", ""],
      default: "",
      index: true,
    },
    expenseCategory: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true, collection: "paymentParticularTemplates" }
);

PaymentParticularTemplateSchema.index(
  {
    particular: 1,
    appliesTo: 1,
    entityType: 1,
    expenseCategory: 1,
  },
  { unique: true }
);

const PaymentParticularTemplate =
  (mongoose.models.paymentParticularTemplates as Model<any>) ||
  mongoose.model("paymentParticularTemplates", PaymentParticularTemplateSchema);

export default PaymentParticularTemplate;
