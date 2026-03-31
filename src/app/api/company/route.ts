import connect from "@/db/mongo";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import {
  createCompanyEntity,
  listCompanyEntities,
  splitEntityPayload,
} from "@/services/entityService";
import { replaceEntityDocuments } from "@/services/entityDocumentService";
import { replaceEntityPasswords } from "@/services/entityPasswordService";
import { PAGINATION, parsePaginationParams } from "@/config/pagination";

export async function POST(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);
    const reqBody = await request.json();
    const { entityData, documents, passwords } = splitEntityPayload(reqBody);

    const data = await createCompanyEntity(entityData);

    if (documents) {
      await replaceEntityDocuments(data._id.toString(), documents);
    }
    if (passwords) {
      await replaceEntityPasswords(data._id.toString(), passwords);
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
  await isAuthenticated(request);

  const { page, limit } = parsePaginationParams(
    request.nextUrl.searchParams,
    PAGINATION.LIMITS.ENTITY_LIST
  );
  const response = await listCompanyEntities(page, limit);

  return Response.json(response, { status: 200 });
}
