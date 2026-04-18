import connect from "@/db/mongo";
import calculateStatus from "@/utils/calculateStatus";
import { TCompanyData } from "@/types/types";
import { NextRequest } from "next/server";
import { requirePermission } from "@/auth/guards";
import {
  getCompanyEntityById,
  softDeleteCompanyEntity,
  splitEntityPayload,
  updateCompanyEntity,
} from "@/services/entityService";
import {
  listEntityDocuments,
  replaceEntityDocuments,
} from "@/services/entityDocumentService";
import {
  listEntityCredentials,
  replaceEntityCredentials,
} from "@/services/entityCredentialService";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";


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
    await updateCompanyEntity(id, entityData);

    if (documents) {
      await replaceEntityDocuments(id, documents);
    }
    if (credentials) {
      await replaceEntityCredentials(id, credentials);
    }

    return Response.json(
      { message: "data updated successfully" },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { message: getServiceErrorMessage(error, "Error updating company data") },
      { status: getServiceErrorStatus(error) }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.write");

    const { id } = params;
    await softDeleteCompanyEntity(id);
    return Response.json({ message: "data deleted" }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: getServiceErrorMessage(error, "Error deleting company data") },
      { status: getServiceErrorStatus(error) }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await requirePermission(request, "entities.read");

    const company: TCompanyData | null = await getCompanyEntityById(params.id);
    const [documents, credentials] = await Promise.all([
      listEntityDocuments(params.id),
      listEntityCredentials(params.id),
    ]);

    if (!company) {
      return Response.json({ message: "Company not found" }, { status: 404 });
    }

    const modifiedDocuments = documents.map(
      ({ _id, documentTemplate, name, issueDate, expiryDate, notes, archived, archiveNotes, archivedAt }) => ({
        _id,
        documentTemplate,
        name,
        issueDate,
        expiryDate,
        notes,
        archived,
        archiveNotes,
        archivedAt,
        status: calculateStatus(expiryDate),
      })
    );

    modifiedDocuments.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

    const responseData = {
      id: company._id,
      name: company.name,
      color: company.color,
      licenseNo: company.licenseNo,
      companyType: company.companyType,
      emirates: company.emirates,
      phone1: company.phone1,
      phone2: company.phone2,
      email: company.email,
      transactionNo: company.transactionNo,
      isMainland: company.isMainland,
      remarks: company.remarks,
      credentials,
      password: credentials,
      documents: modifiedDocuments,
    };

    return Response.json({ data: responseData }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: getServiceErrorMessage(error, "Error fetching company data") },
      { status: getServiceErrorStatus(error) }
    );
  }
}
