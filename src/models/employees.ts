import mongoose, { Schema } from "mongoose";
const employeeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    company: {
      type: mongoose.Types.ObjectId,
      ref: "Company",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emiratesId: String,
    nationality: String,
    phone1: String,
    phone2: String,
    email: String,
    designation: String,
    remarks: String,
    documents: [
      {
        name: String,
        issueDate: String,
        expiryDate: String,
        attachment: String,
      },
    ],
  },
  { timestamps: true },
);
const Employee =
  mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
export default Employee;
