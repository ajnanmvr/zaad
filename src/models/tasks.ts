import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed", "cancelled"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    category: {
      type: String,
      enum: ["visa", "license", "other"],
      default: undefined,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    completionNote: {
      type: String,
      default: "",
      trim: true,
    },
    cancellationNote: {
      type: String,
      default: "",
      trim: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    taskHistory: [
      {
        action: {
          type: String,
          enum: ["created", "todo", "in_progress", "completed", "cancelled"],
          required: true,
        },
        status: {
          type: String,
          enum: ["todo", "in_progress", "completed", "cancelled"],
          required: true,
        },
        note: {
          type: String,
          default: "",
          trim: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
          required: true,
        },
      },
    ],
    linkedTargets: [
      {
        targetType: {
          type: String,
          trim: true,
          lowercase: true,
        },
        targetId: {
          type: String,
          trim: true,
        },
        targetLabel: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

TaskSchema.index({ assignedTo: 1, status: 1, dueDate: 1, createdAt: -1 });
TaskSchema.index({ assignedBy: 1, status: 1, createdAt: -1 });
TaskSchema.index({ "linkedTargets.targetType": 1, "linkedTargets.targetId": 1, createdAt: -1 });

const Task = mongoose.models.tasks || mongoose.model("tasks", TaskSchema);

export default Task;
