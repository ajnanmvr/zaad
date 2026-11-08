import mongoose, { Model, Schema } from "mongoose";

// Title suggestions offered when creating a job, grouped by job category (license / visa).
const JobTitleSuggestionSchema = new Schema(
  {
    category: { type: String, enum: ["license", "visa"], required: true, index: true },
    title: { type: String, required: true, trim: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

const JobTitleSuggestion: Model<any> =
  (mongoose.models.jobTitleSuggestions as Model<any>) ||
  mongoose.model("jobTitleSuggestions", JobTitleSuggestionSchema);

export default JobTitleSuggestion;
