import mongoose, { Schema } from "mongoose";
const recordSchema = new Schema(
  {
    invoiceNo: String,
    title: String,
    particular: String,
    cash: Number,
    bank: Number,
    swiper: Number,
    tasdeed: Number,
    type: {
      type: String,
      required: [true, "Please provide a record type"],
      enum: ["income", "expense"],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "companies",
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "employees",
    },
    remarks: String,
  },
  { timestamps: true }
);

recordSchema.pre("find", function (next) {
  this.populate("company");
  this.populate("employee");
  next();
});

const Records =
  mongoose.models.records || mongoose.model("records", recordSchema);
export default Records;
