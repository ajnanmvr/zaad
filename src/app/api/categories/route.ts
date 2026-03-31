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

    if (type === "document") {
      let values = await DocumentTemplate.distinct("category", {
        published: true,
        category: { $exists: true, $ne: "" },
      });
      if (!values.length) {
        values = await EntityDocument.distinct("category", {
          category: { $exists: true, $ne: "" },
        });
      }
      return Response.json({ options: normalizeValues(values) }, { status: 200 });
    }

    if (type === "credential") {
      let values = await CredentialTemplate.distinct("category", {
        published: true,
        category: { $exists: true, $ne: "" },
      });
      if (!values.length) {
        values = await EntityCredential.distinct("category", {
          category: { $exists: true, $ne: "" },
        });
      }
      return Response.json({ options: normalizeValues(values) }, { status: 200 });
    }

    let [documentValues, credentialValues] = await Promise.all([
      DocumentTemplate.distinct("category", {
        published: true,
        category: { $exists: true, $ne: "" },
      }),
      CredentialTemplate.distinct("category", {
        published: true,
        category: { $exists: true, $ne: "" },
      }),
    ]);

    if (!documentValues.length) {
      documentValues = await EntityDocument.distinct("category", {
        category: { $exists: true, $ne: "" },
      });
    }

    if (!credentialValues.length) {
      credentialValues = await EntityCredential.distinct("category", {
        category: { $exists: true, $ne: "" },
      });
    }

    return Response.json(
      {
        documentOptions: normalizeValues(documentValues),
        credentialOptions: normalizeValues(credentialValues),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return Response.json(
      { message: "Error fetching categories", options: [] },
      { status: 500 }
    );
  }
}
