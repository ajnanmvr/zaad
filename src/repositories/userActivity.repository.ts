import UserActivity from "@/models/userActivity";

export const UserActivityRepository = {
  findByTargetUserPaginated(userId: string, page: number, limit: number) {
    const skip = page * limit;
    return UserActivity.find({ targetUser: userId })
      .populate("performedBy", "username fullname")
      .populate("targetUser", "username fullname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  },

  countByTargetUser(userId: string) {
    return UserActivity.countDocuments({ targetUser: userId });
  },
};