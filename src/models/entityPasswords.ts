import mongoose, { Model, Schema } from "mongoose";

const EntityPasswordSchema = new Schema(
  {
    entity: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      required: true,
      index: true,
    },
    platform: String,
    username: String,
    password: String,
  },
  { timestamps: true }
);

const EntityPassword =
  (mongoose.models.entityPasswords as Model<any>) ||
  mongoose.model("entityPasswords", EntityPasswordSchema);

export default EntityPassword;
