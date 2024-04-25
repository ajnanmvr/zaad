import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    unique: [true, "username already exists"],
  },
  fullname: String,
  password: {
    type: String,
    required: [true, "Please provide a password"],
  },
  role: {
    type: String,
    enum: ["partner", "employee"],
    default: "employee",
  },
});
const User = mongoose.models.users || mongoose.model("users", UserSchema);
export default User;
