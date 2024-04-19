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
    phone1: String,
    phone2: String,
    email: String,
    transactionNo: String,
    isMainland: {
      type: String,
      enum: ["mainland", "freezone", ""],
    },
    remarks: String,
    password: [
      {
        platform: String,
        username: String,
        password: String,
      },
    ],
    documents: [
      {
        name: String,
        issueDate: String,
        expiryDate: String,
        attachment: String,
      },
    ],
    // owners: [
    //   {
    //     name: String,
    //     documents: [
    //       {
    //         name: String,
    //         // issueDate: Date,
    //         // expiryDate: Date,
    //         attachment: String,
    //       },
    //     ],
    //   },
    // ],
  },
  { timestamps: true },
);
const Company =
  mongoose.models.companies || mongoose.model("companies", companySchema);
export default Company;
