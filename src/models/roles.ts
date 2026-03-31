import mongoose, { Model, Schema } from "mongoose";

const RoleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    permissions: {
      type: [String],
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Role =
  (mongoose.models.roles as Model<any>) || mongoose.model("roles", RoleSchema);

export default Role;
