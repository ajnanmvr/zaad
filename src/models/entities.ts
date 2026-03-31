import mongoose, { Model, Schema } from "mongoose";

const EntitySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    phone1: String,
    phone2: String,
    email: String,
    remarks: String,
    published: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "entityType",
    collection: "entities",
  }
);

const CompanySchema = new Schema({
  licenseNo: String,
  companyType: String,
  emirates: String,
  transactionNo: String,
  isMainland: {
    type: String,
    enum: ["mainland", "freezone", ""],
  },
});

const EmployeeSchema = new Schema({
  company: {
    type: Schema.Types.ObjectId,
    ref: "companies",
    required: [true, "Please provide a company"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  emiratesId: String,
  nationality: String,
  designation: String,
});

const IndividualSchema = new Schema({
  isActive: {
    type: Boolean,
    default: true,
  },
  emiratesId: String,
  nationality: String,
  designation: String,
});

const Entity =
  (mongoose.models.entities as Model<any>) ||
  mongoose.model("entities", EntitySchema);

const Company =
  (mongoose.models.companies as Model<any>) ||
  Entity.discriminator("companies", CompanySchema, "company");

const Employee =
  (mongoose.models.employees as Model<any>) ||
  Entity.discriminator("employees", EmployeeSchema, "employee");

const Individual =
  (mongoose.models.individuals as Model<any>) ||
  Entity.discriminator("individuals", IndividualSchema, "individual");

export { Entity, Company, Employee, Individual };
export default Entity;
