import mongoose from "mongoose";

const TaskNotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tasks",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["assigned", "updated", "completed"],
      default: "assigned",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

TaskNotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const TaskNotification =
  mongoose.models.tasknotifications ||
  mongoose.model("tasknotifications", TaskNotificationSchema);

export default TaskNotification;
