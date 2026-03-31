import EntityCredential from "@/models/entityCredentials";
import {
  decryptCredential,
  encryptCredential,
} from "@/utils/credentialsCrypto";

type CredentialInput = {
  platform?: string;
  username?: string;
  password?: string;
  credential?: string;
};

export async function replaceEntityCredentials(
  entityId: string,
  credentials: CredentialInput[]
) {
  await EntityCredential.deleteMany({ entity: entityId });
  if (!credentials.length) {
    return;
  }

  await EntityCredential.insertMany(
    credentials.map((item) => {
      const plainSecret = item?.credential ?? item?.password ?? "";
      return {
        entity: entityId,
        platform: item?.platform,
        username: item?.username,
        secret: plainSecret ? encryptCredential(plainSecret) : "",
      };
    })
  );
}

export async function listEntityCredentials(entityId: string) {
  const rows = await EntityCredential.find({ entity: entityId }).select(
    "platform username secret"
  );

  return rows.map((row: any) => {
    const decrypted = row?.secret ? decryptCredential(row.secret) : "";
    return {
      _id: row._id,
      platform: row.platform,
      username: row.username,
      credential: decrypted,
      password: decrypted,
    };
  });
}
