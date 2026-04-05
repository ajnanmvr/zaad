import mongoose, { Document, Model, Schema } from "mongoose";


export interface IPhysicalHandover extends Document {
  entity: mongoose.Types.ObjectId;
  documentName: string;
  receivedAt: Date;
  returnedAt?: Date;
  status: "received" | "returned";
  receiveNote?: string;
  returnNote?: string;
  remarks?: string;
  receivedBy?: mongoose.Types.ObjectId;
  returnedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PhysicalHandoverSchema = new Schema<IPhysicalHandover>(
  {
    entity: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      required: true,
      index: true,
    },
    documentName: {
      type: String,
      required: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    returnedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["received", "returned"],
      default: "received",
    },
    receiveNote: {
      type: String,
    },
    returnNote: {
      type: String,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    returnedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
  },
  {
    timestamps: true,
    collection: "physicalHandovers",
  }
);

const PhysicalHandover: Model<IPhysicalHandover> =
  (mongoose.models.physicalHandovers as Model<IPhysicalHandover>) ??
  mongoose.model<IPhysicalHandover>(
    "physicalHandovers",
    PhysicalHandoverSchema
  );

export default PhysicalHandover;