import mongoose, { Model, Schema } from "mongoose";

// Explicit per-month overrides of the platform server cost + maintenance charges. Months without a document fall back to the
// defaults in serviceFeeService (paid through the initial paid-until month, unpaid afterwards).
const ServiceFeeMonthSchema = new Schema(
  {
    month: { type: String, required: true, unique: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    paid: { type: Boolean, required: true },
    amount: { type: Number, min: 0, default: null },
    paidOn: { type: String, default: "" },
    notes: { type: String, default: "", trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true },
);

const ServiceFeeMonth: Model<any> =
  (mongoose.models.serviceFeeMonths as Model<any>) ||
  mongoose.model("serviceFeeMonths", ServiceFeeMonthSchema);

export default ServiceFeeMonth;
