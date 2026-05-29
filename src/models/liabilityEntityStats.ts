import mongoose, { Schema, type Model } from "mongoose";

const LiabilityEntityStatsSchema = new Schema(
  {
    entityKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    entity: {
      type: Schema.Types.ObjectId,
      ref: "entities",
      index: true,
    },
    entityName: {
      type: String,
      required: true,
      trim: true,
    },
    income: {
      type: Number,
      default: 0,
    },
    expense: {
      type: Number,
      default: 0,
    },
    net: {
      type: Number,
      default: 0,
    },
    totalTransactions: {
      type: Number,
      default: 0,
    },
    lastRecomputedAt: {
      type: Date,
      default: Date.now,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "liability_entity_stats",
  },
);

const LiabilityEntityStats: Model<any> =
  process.env.NODE_ENV === "development"
    ? (() => {
        if (mongoose.models.LiabilityEntityStats) {
          delete mongoose.models.LiabilityEntityStats;
        }
        return mongoose.model(
          "LiabilityEntityStats",
          LiabilityEntityStatsSchema,
        ) as Model<any>;
      })()
    : (mongoose.models.LiabilityEntityStats as Model<any>) ||
      (mongoose.model(
        "LiabilityEntityStats",
        LiabilityEntityStatsSchema,
      ) as Model<any>);

export default LiabilityEntityStats;
