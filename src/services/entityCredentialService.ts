import EntityCredential from "@/models/entityCredentials";
import CredentialTemplate from "@/models/credentialTemplates";
import {
  decryptCredential,
  encryptCredential,
} from "@/utils/credentialsCrypto";

type CredentialInput = {
  credentialTemplate?: string;
  platform?: string;
  username?: string;
  notes?: string;
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
        credentialTemplate: item?.credentialTemplate,
        notes: item?.notes,
        username: item?.username,
        secret: plainSecret ? encryptCredential(plainSecret) : "",
      };
    })
  );
}

export async function listEntityCredentials(entityId: string) {
  const rows = await EntityCredential.find({ entity: entityId })
    .populate("credentialTemplate", "platform")
    .select("credentialTemplate notes username secret");

  return rows.map((row: any) => {
    const decrypted = row?.secret ? decryptCredential(row.secret) : "";
    return {
      _id: row._id,
      credentialTemplate: row.credentialTemplate?._id || row.credentialTemplate,
      platform: row.credentialTemplate?.platform || "",
      notes: row.notes,
      username: row.username,
      credential: decrypted,
      password: decrypted,
    };
  });
}

export async function createEntityCredential(entityId: string, payload: CredentialInput) {
  return EntityCredential.create({
    entity: entityId,
    credentialTemplate: payload?.credentialTemplate,
    notes: payload?.notes,
    username: payload?.username,
    secret: payload?.password ? encryptCredential(payload.password) : "",
  });
}

export async function updateEntityCredential(
  entityId: string,
  credentialId: string,
  payload: CredentialInput
) {
  return EntityCredential.findOneAndUpdate(
    { _id: credentialId, entity: entityId },
    {
      ...(payload.credentialTemplate !== undefined
        ? { credentialTemplate: payload.credentialTemplate }
        : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(payload.username !== undefined ? { username: payload.username } : {}),
      ...(payload.password !== undefined
        ? { secret: encryptCredential(payload.password) }
        : {}),
    },
    { new: true }
  );
}

export async function deleteEntityCredential(entityId: string, credentialId: string) {
  return EntityCredential.findOneAndDelete({ _id: credentialId, entity: entityId });
}

export async function listCredentialTemplateOptions() {
  const rows = await CredentialTemplate.find({})
    .select("platform")
    .sort({ platform: 1 });

  return rows.map((row: any) => ({
    id: row._id.toString(),
    label: row.platform,
    platform: row.platform,
  }));
}
