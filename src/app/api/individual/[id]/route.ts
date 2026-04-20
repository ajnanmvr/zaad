import { NextRequest } from "next/server";

import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import calculateStatus from "@/utils/calculateStatus";
import Individual from "@/models/individuals";
import {
  listEntityCredentials,
  replaceEntityCredentials,
} from "@/services/entityCredentialService";
import {
  listEntityDocuments,
  replaceEntityDocuments,
} from "@/services/entityDocumentService";
import {
  softDeleteIndividualEntity,
  splitEntityPayload,
  updateEmployeeEntity,
} from "@/services/entityService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.read");

    const individual = await Individual.findById(params.id);
    const [documents, credentials] = await Promise.all([
      listEntityDocuments(params.id),
      listEntityCredentials(params.id),
    ]);

    if (!individual) {
      return Response.json({ message: "Individual not found" }, { status: 404 });
    }

    const modifiedDocuments = documents
      .map((document: any) => ({
        _id: document._id,
        documentTemplate: document.documentTemplate,
        name: document.name,
        issueDate: document.issueDate,
        expiryDate: document.expiryDate,
        notes: document.notes,
        archived: document.archived,
        archiveNotes: document.archiveNotes,
        archivedAt: document.archivedAt,
        status: calculateStatus(document.expiryDate),
      }))
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

    const responseData = {
      id: individual._id,
      name: individual.name,
      color: individual.color,
      emiratesId: individual.emiratesId,
      nationality: individual.nationality,
      phone1: individual.phone1,
      phone2: individual.phone2,
      email: individual.email,
      designation: individual.designation,
      remarks: individual.remarks,
      credentials,
      password: credentials,
      documents: modifiedDocuments,
    };

    return Response.json({ data: responseData }, { status: 200 });
  } catch (error) {
    return Response.json({ message: "Error fetching individual data", error }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.write");

    const { id } = params;
    const reqBody = await request.json();
    const { entityData, documents, credentials } = splitEntityPayload(reqBody);

    await updateEmployeeEntity(id, entityData);

    if (documents) {
      await replaceEntityDocuments(id, documents);
    }
    if (credentials) {
      await replaceEntityCredentials(id, credentials);
    }

    return Response.json({ message: "Data updated successfully" }, { status: 201 });
  } catch (error) {
    return Response.json({ message: "Error updating individual data", error }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.write");

    const individual = await softDeleteIndividualEntity(params.id);
    if (!individual) {
      return Response.json({ message: "Individual not found" }, { status: 404 });
    }

    return Response.json({ message: "Data deleted" }, { status: 200 });
  } catch (error) {
    return Response.json({ message: "Error deleting individual data", error }, { status: 500 });
  }
}
