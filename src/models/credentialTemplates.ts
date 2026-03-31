import mongoose, { Model, Schema } from "mongoose";

const CredentialTemplateSchema = new Schema(
  {
    platform: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, collection: "credentialTemplates" }
);

CredentialTemplateSchema.index({ category: 1, platform: 1 }, { unique: true });

const CredentialTemplate =
  (mongoose.models.credentialTemplates as Model<any>) ||
  mongoose.model("credentialTemplates", CredentialTemplateSchema);

export default CredentialTemplate;
