import mongoose, { Model, Schema } from "mongoose";

const DocumentTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, collection: "documentTemplates" }
);

DocumentTemplateSchema.index({ name: 1 }, { unique: true });

const DocumentTemplate =
  (mongoose.models.documentTemplates as Model<any>) ||
  mongoose.model("documentTemplates", DocumentTemplateSchema);

export default DocumentTemplate;
