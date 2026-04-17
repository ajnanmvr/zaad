import mongoose, { Model, Schema } from "mongoose";

const PaymentParticularTemplateSchema = new Schema(
  {
    particular: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: [String],
      default: ["office_records"],
      index: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true, collection: "paymentParticularTemplates" },
);

PaymentParticularTemplateSchema.index(
  {
    particular: 1,
  },
  { unique: false },
);

const PaymentParticularTemplate =
  (mongoose.models.paymentParticularTemplates as Model<any>) ||
  mongoose.model("paymentParticularTemplates", PaymentParticularTemplateSchema);

export default PaymentParticularTemplate;
