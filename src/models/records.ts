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
      enum: ["bank", "cash", "tasdeed", "swiper","service fee"],
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
    remarks:String
  },
  {
    timestamps: true,
  }
);

const Records =
  mongoose.models.records || mongoose.model("records", RecordSchema);
export default Records;
