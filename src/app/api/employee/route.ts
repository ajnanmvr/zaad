import connect from "@/db/mongo";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import {
  createEmployeeOrIndividualEntity,
  listEmployeeEntities,
  splitEntityPayload,
} from "@/services/entityService";
import { replaceEntityDocuments } from "@/services/entityDocumentService";
import { replaceEntityCredentials } from "@/services/entityCredentialService";
import { PAGINATION, parsePaginationParams } from "@/config/pagination";

export async function POST(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);

    const reqBody = await request.json();
    const { entityData, documents, credentials } = splitEntityPayload(reqBody);

    const data = await createEmployeeOrIndividualEntity(
      entityData,
      reqBody?.entityType
    );

    if (documents) {
      await replaceEntityDocuments(data._id.toString(), documents);
    }
    if (credentials) {
      await replaceEntityCredentials(data._id.toString(), credentials);
    }

    return Response.json(
      {
        message:
          reqBody?.entityType === "individual"
            ? "Created new individual"
            : "Created new employee",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await isAuthenticated(request);

    const { page, limit } = parsePaginationParams(
      request.nextUrl.searchParams,
      PAGINATION.LIMITS.ENTITY_LIST
    );
    const response = await listEmployeeEntities(page, limit);

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return Response.json(
      { error: "Error fetching employees" },
      { status: 500 }
    );
  }
}
