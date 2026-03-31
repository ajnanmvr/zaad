import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: [true, "username already exists"],
  },
  fullname: {
    type: String,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
  },
  role: {
    type: String,
    enum: ["partner", "employee"],
    default: "employee",
  },
  published: {
    type: Boolean,
    default: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  passwordChangedAt: {
    type: Date,
    default: null,
  },
  failedLoginCount: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  roleVersion: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true
});
const User = mongoose.models.users || mongoose.model("users", UserSchema);
export default User;
