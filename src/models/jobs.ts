import mongoose, { Schema, type Model } from "mongoose";

const JobSchema = new Schema(
  {
    // Auto-generated, human-readable identifier (JOB-0001). Records link via `records.jobId`.
    jobId: {
      type: String,
      required: [true, "Job ID is required"],
      trim: true,
      index: true,
    },
    title: { type: String, required: [true, "Title is required"], trim: true },
    description: { type: String, trim: true, default: "" },
    entity: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      required: [true, "Client is required"],
      index: true,
    },
    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "users" },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const CounterSchema = new Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

export const Counters: Model<any> =
  (mongoose.models.Counter as Model<any>) ||
  (mongoose.model("Counter", CounterSchema) as Model<any>);

const Jobs: Model<any> =
  (mongoose.models.Job as Model<any>) || (mongoose.model("Job", JobSchema) as Model<any>);

export default Jobs;
