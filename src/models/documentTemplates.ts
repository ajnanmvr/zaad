import mongoose, { Model, Schema } from "mongoose";

const DocumentTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: ["visa", "license", "other"],
      default: "other",
      lowercase: true,
      trim: true,
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "documentTemplates" }
);

DocumentTemplateSchema.index({ name: 1 }, { unique: true });

const DocumentTemplate =
  (mongoose.models.documentTemplates as Model<any>) ||
  mongoose.model("documentTemplates", DocumentTemplateSchema);

export default DocumentTemplate;
