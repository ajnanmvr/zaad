import EntityPassword from "@/models/entityPasswords";

type PasswordInput = {
  platform?: string;
  username?: string;
  password?: string;
};

export async function replaceEntityPasswords(entityId: string, passwords: PasswordInput[]) {
  await EntityPassword.deleteMany({ entity: entityId });
  if (!passwords.length) {
    return;
  }

  await EntityPassword.insertMany(
    passwords.map((item) => ({
      entity: entityId,
      platform: item?.platform,
      username: item?.username,
      password: item?.password,
    }))
  );
}

export async function listEntityPasswords(entityId: string) {
  return EntityPassword.find({ entity: entityId }).select(
    "platform username password"
  );
}
