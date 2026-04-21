import { NextRequest, NextResponse } from "next/server";
import connect from "@/db/mongo";
import { requireAnyPermission } from "@/auth/guards";
import EntityCredential from "@/models/entityCredentials";
import { decryptCredential } from "@/utils/credentialsCrypto";

export const dynamic = "force-dynamic";

type CredentialRow = {
  id: string;
  entityId: string;
  entityName: string;
  entityType: string;
  entityColor?: string;
  platform: string;
  username?: string;
  notes?: string;
  credential?: string;
};

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requireAnyPermission(request, ["entities.write", "entities.read"]);

    const platformFilter = String(request.nextUrl.searchParams.get("platform") || "").trim().toLowerCase();
    const search = String(request.nextUrl.searchParams.get("search") || "").trim().toLowerCase();

    const rows = await EntityCredential.find({})
      .populate("entity", "name color entityType")
      .populate("credentialTemplate", "platform")
      .sort({ createdAt: -1 })
      .lean();

    const data: CredentialRow[] = rows
      .map((row: any) => {
        const entity = row?.entity;
        const template = row?.credentialTemplate;
        const platform = String(template?.platform || row?.platform || "").trim();
        const secret = row?.secret ? decryptCredential(String(row.secret)) : "";

        return {
          id: String(row?._id || ""),
          entityId: String(entity?._id || ""),
          entityName: String(entity?.name || "Unknown Entity"),
          entityType: String(entity?.entityType || "company"),
          entityColor: entity?.color,
          platform,
          username: row?.username || "",
          notes: row?.notes || "",
          credential: secret,
        };
      })
      .filter((row: CredentialRow) => {
        const platformMatch = !platformFilter || row.platform.toLowerCase() === platformFilter;
        const searchMatch =
          !search ||
          [row.entityName, row.entityType, row.platform, row.username || "", row.notes || ""]
            .join(" ")
            .toLowerCase()
            .includes(search);
        return platformMatch && searchMatch;
      });

    return NextResponse.json({ success: true, summary: data });
  } catch (error: any) {
    console.error("Error fetching credentials list:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch credentials list" },
      { status: 500 },
    );
  }
}
