import mongoose, { Schema } from "mongoose";
const updateSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image: String,
    category: String,
    description: String,
    isPublished: Boolean,
    slug: String,
  },
  { timestamps: true }
);
const Update = mongoose.models.Update || mongoose.model("Update", updateSchema);
export default Update;
