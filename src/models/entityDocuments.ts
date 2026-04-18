import mongoose, { Model, Schema } from "mongoose";

const EntityDocumentSchema = new Schema(
  {
    entity: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      required: true,
      index: true,
    },
    documentTemplate: {
      type: Schema.Types.ObjectId,
      ref: "documentTemplates",
      index: true,
    },
    issueDate: String,
    expiryDate: String,
    notes: String,
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archiveNotes: String,
    archivedAt: Date,
  },
  { timestamps: true, collection: "documents" },
);

const EntityDocument =
  (mongoose.models.documents as Model<any>) ||
  mongoose.model("documents", EntityDocumentSchema);

export default EntityDocument;
