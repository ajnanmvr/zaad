import mongoose, { Schema } from "mongoose";
const InvoiceSchema = new Schema(
  {
    title: String,
    suffix: String,
    invoiceNo: Number,
    client: String,
    entityId: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      default: null,
    },
    entityType: {
      type: String,
      enum: ["company", "employee", "individual", null],
      default: null,
    },
    location: String,
    trn: String,
    purpose: String,
    advance: Number,
    showBalance:String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    published: {
      type: Boolean,
      default: true,
    },
    date: String,
    validTo: String,
    quotation: {
      type: String,
      default: false,
    },
    message: String,
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
