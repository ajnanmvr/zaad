import User from "@/models/users";

type TUserSort = "newest" | "oldest" | "username-asc" | "username-desc" | "fullname-asc" | "fullname-desc";

const SORT_MAP: Record<TUserSort, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "username-asc": { username: 1 },
  "username-desc": { username: -1 },
  "fullname-asc": { fullname: 1 },
  "fullname-desc": { fullname: -1 },
};

export function buildUserListQuery(input: {
  search?: string;
  showDeleted: boolean;
  role?: string;
}) {
  const query: any = { published: !input.showDeleted };

  if (input.role && input.role !== "all") {
    query.role = input.role;
  }

  if (input.search) {
    query.$or = [
      { username: { $regex: input.search, $options: "i" } },
      { fullname: { $regex: input.search, $options: "i" } },
    ];
  }

  return query;
}

export function getUserSort(sortBy: TUserSort | undefined) {
  if (!sortBy) {
    return SORT_MAP.newest;
  }
  return SORT_MAP[sortBy] || SORT_MAP.newest;
}

export async function countUsers(query: any) {
  return User.countDocuments(query);
}

export async function findUsers(query: any, sort: Record<string, 1 | -1>, skip: number, limit: number) {
  return User.find(query)
    .select("username fullname role createdAt updatedAt deletedAt")
    .sort(sort)
    .skip(skip)
    .limit(limit);
}

export async function findActiveUserByUsername(username: string) {
  return User.findOne({ username, published: true });
}

export async function findActiveUserById(id: string) {
  return User.findOne({ _id: id, published: true });
}

export async function findDeletedUserById(id: string) {
  return User.findOne({ _id: id, published: false }).select(
    "username fullname role createdAt"
  );
}

export async function findActiveUserByUsernameExcludingId(username: string, excludedId: string) {
  return User.findOne({
    username,
    published: true,
    _id: { $ne: excludedId },
  });
}

export async function createUser(data: {
  username: string;
  password: string;
  role: string;
  fullname: string;
}) {
  const newUser = new User(data);
  return newUser.save();
}

export async function findUserById(id: string) {
  return User.findById(id).select(
    "username fullname role createdAt updatedAt published deletedAt"
  );
}

export async function updateUserById(id: string, updateData: any) {
  return User.findByIdAndUpdate(id, updateData, { new: true }).select(
    "username fullname role createdAt updatedAt"
  );
}

export async function softDeleteUserById(id: string) {
  return User.findByIdAndUpdate(id, {
    published: false,
    deletedAt: new Date(),
  });
}

export async function reactivateUserById(id: string) {
  return User.findByIdAndUpdate(id, {
    published: true,
    deletedAt: null,
  });
}
