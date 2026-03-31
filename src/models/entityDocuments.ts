import mongoose, { Model, Schema } from "mongoose";

const EntityDocumentSchema = new Schema(
  {
    entity: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      required: true,
      index: true,
    },
    category: String,
    name: String,
    issueDate: String,
    expiryDate: String,
    attachment: String,
  },
  { timestamps: true, collection: "documents" }
);

const EntityDocument =
  (mongoose.models.documents as Model<any>) ||
  mongoose.model("documents", EntityDocumentSchema);

export default EntityDocument;
