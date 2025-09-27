import mongoose from "mongoose";

const UserActivitySchema = new mongoose.Schema({
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    action: {
        type: String,
        enum: ["create", "update", "delete", "password_change", "role_change", "reactivate"],
        required: true,
    },
    details: {
        type: Object,
        default: {},
    },
    previousValues: {
        type: Object,
        default: {},
    },
    newValues: {
        type: Object,
        default: {},
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },
}, {
    timestamps: true
});

// Index for efficient querying
UserActivitySchema.index({ targetUser: 1, createdAt: -1 });
UserActivitySchema.index({ performedBy: 1, createdAt: -1 });

const UserActivity = mongoose.models.useractivities || mongoose.model("useractivities", UserActivitySchema);
export default UserActivity;