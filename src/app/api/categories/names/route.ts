import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import EntityDocument from "@/models/entityDocuments";
import EntityCredential from "@/models/entityCredentials";
import DocumentTemplate from "@/models/documentTemplates";
import CredentialTemplate from "@/models/credentialTemplates";

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
    const category = (request.nextUrl.searchParams.get("category") || "").trim();

    if (!type || !category) {
      return Response.json({ options: [] }, { status: 200 });
    }

    if (type === "document") {
      let values = await DocumentTemplate.distinct("name", {
        published: true,
        category,
      });
      if (!values.length) {
        values = await EntityDocument.distinct("name", { category });
      }
      return Response.json({ options: normalizeValues(values) }, { status: 200 });
    }

    if (type === "credential") {
      let values = await CredentialTemplate.distinct("platform", {
        published: true,
        category,
      });
      if (!values.length) {
        values = await EntityCredential.distinct("platform", { category });
      }
      return Response.json({ options: normalizeValues(values) }, { status: 200 });
    }

    return Response.json({ message: "Invalid type", options: [] }, { status: 400 });
  } catch (error) {
    console.error("Error fetching category names:", error);
    return Response.json(
      { message: "Error fetching category names", options: [] },
      { status: 500 }
    );
  }
}
