import mongoose, { Schema } from "mongoose";

const RecordSchema = new Schema(
  {
    suffix: String,
    number: Number,
    particular: { type: String, required: true, trim: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "officeExpenseCategories",
      index: true,
    },
    serviceFee: Number,
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: Schema.Types.ObjectId,
      ref: "paymentTemplates",
      required: [true, "Please provide a payment method template"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Please provide a record type"],
      enum: ["income", "expense"],
    },
    entity: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      index: true,
    },
    status: {
      type: Schema.Types.ObjectId,
      ref: "paymentStatusTemplates",
      required: function (this: any) {
        return this.recordKind !== "liability";
      },
      index: true,
    },
    recordKind: {
      type: String,
      enum: [
        "standard",
        "self_transfer",
        "liability",
        "instant_profit",
        "office_records",
      ],
      default: "standard",
      index: true,
    },
    transferGroupId: {
      type: String,
      trim: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    remarks: String,
    edited: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
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
