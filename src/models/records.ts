import mongoose, { Schema } from "mongoose";
const RecordSchema = new Schema(
  {
    suffix: String,
    number: Number,
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
      enum: ["bank", "cash", "tasdeed", "swiper", "service fee", "liability"],
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
    remarks: String,
    edited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Records =
  mongoose.models.Record || mongoose.model("Record", RecordSchema);
export default Records;
