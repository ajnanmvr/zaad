import mongoose, { Schema } from "mongoose";

import "./companies";
import "./employees";
import "./users";

const RecordSchema = new Schema(
  {
    suffix: String,
    number: Number,
    invoiceNo: String,
    particular: String,
    serviceFee: Number,
    status: String,
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      required: [true, "Please provide a payment method"],
    },
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
    edited: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    activityLog: [
      {
        action: {
          type: String,
          enum: ["create", "update", "delete", "recover"],
          required: true,
        },
        at: {
          type: Date,
          default: Date.now,
        },
        by: {
          type: Schema.Types.ObjectId,
          ref: "users",
        },
        byUsername: String,
        byFullname: String,
        details: String,
        previousValues: {
          type: Schema.Types.Mixed,
          default: undefined,
        },
        newValues: {
          type: Schema.Types.Mixed,
          default: undefined,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Records =
  mongoose.models.Record || mongoose.model("Record", RecordSchema);
export default Records;
