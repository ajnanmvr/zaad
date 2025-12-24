import User from "@/models/users";

export const UserRepository = {
  count(query: any) {
    return User.countDocuments(query);
  },

  findPaginated(query: any, page: number, limit: number) {
    return User.find(query)
      .select("username fullname role createdAt updatedAt deletedAt")
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .lean();
  },

  findById(id: string) {
    return User.findById(id).select("username fullname role createdAt updatedAt published deletedAt").lean();
  },

  findOne(query: any) {
    return User.findOne(query);
  },

  create(data: any) {
    const user = new (User as any)(data);
    return user.save();
  },

  updateById(id: string, data: any) {
    return User.findByIdAndUpdate(id, data, { new: true }).select("username fullname role createdAt updatedAt").lean();
  },

  softDelete(id: string) {
    return User.findByIdAndUpdate(id, { published: false, deletedAt: new Date() });
  },
};