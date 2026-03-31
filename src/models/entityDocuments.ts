import mongoose, { Model, Schema } from "mongoose";

const EntityDocumentSchema = new Schema(
  {
    entity: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      required: true,
      index: true,
    },
    name: String,
    issueDate: String,
    expiryDate: String,
    attachment: String,
  },
  { timestamps: true }
);

const EntityDocument =
  (mongoose.models.entityDocuments as Model<any>) ||
  mongoose.model("entityDocuments", EntityDocumentSchema);

export default EntityDocument;
