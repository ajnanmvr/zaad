import mongoose, { Schema } from "mongoose";
const RecordSchema = new Schema(
  {
    invoiceNo: String,
    particular: String,
    serviceFee: Number,
    status: String,
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      required: [true, "Please provide a payment method"],
      enum: ["bank", "cash", "tasdeed", "swiper"],
    },
    type: {
      type: String,
      required: [true, "Please provide a record type"],
      enum: ["income", "expense"],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "companies",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    self: String,
    published: {
      type: Boolean,
      default: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "employees",
    },
  },
  {
    timestamps: true,
  }
);

const Records =
  mongoose.models.records || mongoose.model("records", RecordSchema);
export default Records;
