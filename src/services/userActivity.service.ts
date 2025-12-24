import { UserActivityRepository } from "@/repositories/userActivity.repository";
import { serializeObjectIds } from "@/utils/serialization";
import connect from "@/db/mongo";

export const UserActivityService = {
  async getHistory(userId: string, page: number = 0, limit: number = 10) {
    await connect();
    const activities = await UserActivityRepository.findByTargetUserPaginated(userId, page, limit);
    const total = await UserActivityRepository.countByTargetUser(userId);

    return {
      activities: activities.map((a: any) => serializeObjectIds(a)),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalActivities: total,
        hasMore: (page + 1) * limit < total,
      },
    };
  },
};