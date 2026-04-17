import mongoose, { Schema } from "mongoose";

const RecordSchema = new Schema(
  {
    suffix: String,
    number: Number,
    particular: { type: String, required: true, trim: true },
    serviceFee: Number,
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      trim: true,
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
    paymentMethodTemplate: {
      type: Schema.Types.ObjectId,
      ref: "paymentTemplates",
      required: [true, "Please provide a payment method template"],
      index: true,
    },
    paymentStatusTemplate: {
      type: Schema.Types.ObjectId,
      ref: "paymentStatusTemplates",
      required: [true, "Please provide a payment status template"],
      index: true,
    },
    recordKind: {
      type: String,
      enum: [
        "standard",
        "company",
        "self_transfer_in",
        "self_transfer_out",
        "liability",
        "instant_profit",
      ],
      default: "standard",
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
    discriminatorKey: "recordKind",
  },
);

const CompanyRecordSchema = new Schema({
  companyContext: {
    type: Boolean,
    default: true,
  },
});

const SelfTransferRecordSchema = new Schema({
  transferDirection: {
    type: String,
    enum: ["in", "out"],
  },
  transferGroupId: {
    type: String,
    trim: true,
    index: true,
  },
});

const LiabilityRecordSchema = new Schema({
  liabilityContext: {
    type: Boolean,
    default: true,
  },
});

const InstantProfitRecordSchema = new Schema({
  instantProfitContext: {
    type: Boolean,
    default: true,
  },
});

const Records =
  mongoose.models.Record || mongoose.model("Record", RecordSchema);

if (!mongoose.models.CompanyRecord) {
  (Records as any).discriminator(
    "CompanyRecord",
    CompanyRecordSchema,
    "company",
  );
}

if (!mongoose.models.SelfTransferRecord) {
  (Records as any).discriminator(
    "SelfTransferRecord",
    SelfTransferRecordSchema,
    "self_transfer_in",
  );
}

if (!mongoose.models.SelfTransferOutRecord) {
  (Records as any).discriminator(
    "SelfTransferOutRecord",
    SelfTransferRecordSchema,
    "self_transfer_out",
  );
}

if (!mongoose.models.LiabilityRecord) {
  (Records as any).discriminator(
    "LiabilityRecord",
    LiabilityRecordSchema,
    "liability",
  );
}

if (!mongoose.models.InstantProfitRecord) {
  (Records as any).discriminator(
    "InstantProfitRecord",
    InstantProfitRecordSchema,
    "instant_profit",
  );
}

export default Records;
