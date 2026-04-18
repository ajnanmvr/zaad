import mongoose, { Model, Schema } from "mongoose";

const PaymentStatusTemplateSchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      uppercase: true,
    },
    appliesTo: {
      type: String,
      enum: ["income", "expense", "both"],
      default: "both",
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "paymentStatusTemplates" }
);

PaymentStatusTemplateSchema.index({ status: 1 }, { unique: true });

const PaymentStatusTemplate =
  (mongoose.models.paymentStatusTemplates as Model<any>) ||
  mongoose.model("paymentStatusTemplates", PaymentStatusTemplateSchema);

export default PaymentStatusTemplate;
