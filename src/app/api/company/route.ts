import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import {
  createCompanyEntity,
  listCompanyEntities,
  splitEntityPayload,
} from "@/services/entityService";
import { replaceEntityDocuments } from "@/services/entityDocumentService";
import { replaceEntityCredentials } from "@/services/entityCredentialService";
import { PAGINATION, parsePaginationParams } from "@/config/pagination";

export async function POST(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "entities.write");
    const reqBody = await request.json();
    const { entityData, documents, credentials } = splitEntityPayload(reqBody);

    const data = await createCompanyEntity(entityData);

    if (documents) {
      await replaceEntityDocuments(data._id.toString(), documents);
    }
    if (credentials) {
      await replaceEntityCredentials(data._id.toString(), credentials);
    }

    return Response.json(
      { message: "Created new company", data },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error);
  }
}

export async function GET(request: NextRequest) {
  await connect();
  await requirePermission(request, "entities.read");

  const { page, limit } = parsePaginationParams(
    request.nextUrl.searchParams,
    PAGINATION.LIMITS.ENTITY_LIST
  );

  const search = request.nextUrl.searchParams.get("search")?.trim();
  const sortByParam = request.nextUrl.searchParams.get("sortBy");
  const createdWithinDaysParam = request.nextUrl.searchParams.get("createdWithinDays");
  const createdWithinDays = createdWithinDaysParam
    ? Number(createdWithinDaysParam)
    : undefined;

  const response = await listCompanyEntities(page, limit, {
    search: search || undefined,
    sortBy:
      sortByParam === "newest" ||
      sortByParam === "oldest" ||
      sortByParam === "name-asc" ||
      sortByParam === "name-desc"
        ? sortByParam
        : undefined,
    createdWithinDays:
      typeof createdWithinDays === "number" && Number.isFinite(createdWithinDays)
        ? createdWithinDays
        : undefined,
  });

  return Response.json(response, { status: 200 });
}
