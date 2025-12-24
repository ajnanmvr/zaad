import { UserActivityRepository } from "@/repositories/userActivity.repository";

export const UserActivityService = {
  async getHistory(userId: string, page: number = 0, limit: number = 10) {
    const activities = await UserActivityRepository.findByTargetUserPaginated(userId, page, limit);
    const total = await UserActivityRepository.countByTargetUser(userId);

    return {
      activities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalActivities: total,
        hasMore: (page + 1) * limit < total,
      },
    };
  },
};