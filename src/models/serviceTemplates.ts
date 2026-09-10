import mongoose, { Model, Schema } from "mongoose";

const ServiceTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    kind: {
      type: String,
      enum: ["visa", "license", "other"],
      default: "other",
      trim: true,
      lowercase: true,
      index: true,
    },
    color: {
      type: String,
      trim: true,
      uppercase: true,
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "serviceTemplates" },
);

ServiceTemplateSchema.index({ name: 1 }, { unique: true });

const ServiceTemplate =
  (mongoose.models.serviceTemplates as Model<any>) ||
  mongoose.model("serviceTemplates", ServiceTemplateSchema);

export default ServiceTemplate;
