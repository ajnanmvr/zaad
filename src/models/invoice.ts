import mongoose, { Schema } from "mongoose";
const InvoiceSchema = new Schema(
  {
    title: String,
    suffix: String,
    invoiceNo: {
      type: Number,
      required: [true, "please provide an invoice number"],
    },
    client: String,
    location: String,
    trn: String,
    purpose: String,
    advance: Number,
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
    remarks: String,
  },
  {
    timestamps: true,
  }
);

const Invoice =
  mongoose.models.invoice || mongoose.model("invoice", InvoiceSchema);
export default Invoice;
