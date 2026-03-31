import mongoose, { Model, Schema } from "mongoose";

const UserSessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    replacedBySessionId: {
      type: Schema.Types.ObjectId,
      ref: "userSessions",
      default: null,
    },
  },
  { timestamps: true }
);

const UserSession =
  (mongoose.models.userSessions as Model<any>) ||
  mongoose.model("userSessions", UserSessionSchema);

export default UserSession;
