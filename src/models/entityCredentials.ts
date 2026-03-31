import mongoose, { Model, Schema } from "mongoose";

const EntityCredentialSchema = new Schema(
  {
    entity: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      required: true,
      index: true,
    },
    username: String,
    secret: String,
  },
  { timestamps: true, collection: "credentials" }
);

const EntityCredential =
  (mongoose.models.credentials as Model<any>) ||
  mongoose.model("credentials", EntityCredentialSchema);

export default EntityCredential;
