import mongoose, { Model, Schema } from "mongoose";

const CredentialTemplateSchema = new Schema(
  {
    platform: {
      type: String,
      required: true,
      trim: true,
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "credentialTemplates" }
);

CredentialTemplateSchema.index({ platform: 1 }, { unique: true });

const CredentialTemplate =
  (mongoose.models.credentialTemplates as Model<any>) ||
  mongoose.model("credentialTemplates", CredentialTemplateSchema);

export default CredentialTemplate;
