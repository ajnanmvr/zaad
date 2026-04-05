import mongoose, { Model, Schema } from "mongoose";

const PaymentTemplateSchema = new Schema(
  {
    method: {
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
      default: "card",
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "paymentTemplates" }
);

PaymentTemplateSchema.index({ method: 1 }, { unique: true });

const PaymentTemplate =
  (mongoose.models.paymentTemplates as Model<any>) ||
  mongoose.model("paymentTemplates", PaymentTemplateSchema);

export default PaymentTemplate;
