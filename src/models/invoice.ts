import mongoose, { Schema } from "mongoose";
const InvoiceSchema = new Schema(
  {
    title: String,
    suffix: String,
    invoiceNo: {
      type: String,
      required: [true, "please provide an invoice number"],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "companies",
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "employees",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Please Define a Creator"],
    },
    published: {
      type: Boolean,
      default: true,
    },
    date: String,
    items: [{ title: String, desc: String, rate: Number, quantity: Number }],
    notes: String,
  },
  {
    timestamps: true,
  }
);

const Invoice =
  mongoose.models.invoice || mongoose.model("invoice", InvoiceSchema);
export default Invoice;
