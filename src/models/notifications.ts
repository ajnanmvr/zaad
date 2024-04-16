import mongoose, { Schema } from "mongoose";
const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: [true,"Please provide a title"]
    },
    category: {
      type: String,
      required: [true,"Please provide a category"]
    },
    description: String,
    isPublished: Boolean,
  },
  { timestamps: true }
);
const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
export default Notification;
