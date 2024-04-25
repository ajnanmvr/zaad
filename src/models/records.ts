import mongoose, { Schema } from "mongoose";
const RecordSchema = new Schema(
  {
    invoiceNo: String,
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Please Define a Creator"],
    },
    lastUpdatedBy: {
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
  },
  { timestamps: true }
);

RecordSchema.pre("find", function (next) {
  this.populate(["company", "employee", "createdBy", "lastUpdatedBy"]);
  next();
});

const Records =
  mongoose.models.records || mongoose.model("records", RecordSchema);
export default Records;
