import mongoose, { Schema } from "mongoose";
const employeeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "companies",
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

employeeSchema.pre("find", function (next) {
  this.populate("company");
  next();
});

const Employee =
  mongoose.models.employees || mongoose.model("employees", employeeSchema);
export default Employee;
