import mongoose, { Schema } from "mongoose";
const EmployeeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
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
    published: {
      type: Boolean,
      default: true,
    },
    documents: [
      {
        name: String,
        issueDate: String,
        expiryDate: String,
        attachment: String,
      },
    ],
  },
  { timestamps: true }
);

const Employee =
  mongoose.models.individual || mongoose.model("individual", EmployeeSchema);
export default Employee;
