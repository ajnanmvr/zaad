import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import DocumentTemplate from "@/models/documentTemplates";
import CredentialTemplate from "@/models/credentialTemplates";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

function normalizeValues(values: unknown[]) {
  const cleaned = values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => Boolean(value));

  return Array.from(new Set(cleaned)).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "entities.write");

    const type = request.nextUrl.searchParams.get("type");

    if (type === "document") {
      const values = await DocumentTemplate.distinct("name", {
        name: { $exists: true, $ne: "" },
      });
      return Response.json({ options: normalizeValues(values) }, { status: 200 });
    }

    if (type === "credential") {
      const values = await CredentialTemplate.distinct("platform", {
        platform: { $exists: true, $ne: "" },
      });
      return Response.json({ options: normalizeValues(values) }, { status: 200 });
    }

    const [documentValues, credentialValues] = await Promise.all([
      DocumentTemplate.distinct("name", {
        name: { $exists: true, $ne: "" },
      }),
      CredentialTemplate.distinct("platform", {
        platform: { $exists: true, $ne: "" },
      }),
    ]);

    return Response.json(
      {
        documentOptions: normalizeValues(documentValues),
        credentialOptions: normalizeValues(credentialValues),
      },
      { status: 200 }
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error fetching categories:", error);
    }

    return Response.json(
      { message: getServiceErrorMessage(error, "Error fetching categories"), options: [] },
      { status }
    );
  }
}

