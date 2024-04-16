import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide a username"],
      unique: [true, "username already exists"],
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
  }
);
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
