import mongoose, { Schema } from "mongoose";
const companySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    licenseNo: String,
    companyType: String,
    emirates: String,
    phone: String,
    email: String,
    password: [
      {
        platform: String,
        username: String,
        password: String,
      },
    ],
    transactionNo: String,
    isMainland: {
      type: String,
      enum: ["mainland", "freezone"],
    },
    remarks: String,
    documents: [
      {
        name: String,
        issueDate: Date,
        expiryDate: Date,
        attachment: String,
      },
    ],
    owners: [
      {
        name: String,
        documents: [
          {
            name: String,
            issueDate: Date,
            expiryDate: Date,
            attachment: String,
          },
        ],
      },
    ],
  },
  { timestamps: true },
);
const Company =
  mongoose.models.Company || mongoose.model("Company", companySchema);
export default Company;
