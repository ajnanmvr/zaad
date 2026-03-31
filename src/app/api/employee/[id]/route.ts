import connect from "@/db/mongo";
import calculateStatus from "@/utils/calculateStatus";
import { TEmployeeData } from "@/types/types";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";
import {
  getEmployeeEntityById,
  softDeleteEmployeeEntity,
  splitEntityPayload,
  updateEmployeeEntity,
} from "@/services/entityService";
import {
  listEntityDocuments,
  replaceEntityDocuments,
} from "@/services/entityDocumentService";
import {
  listEntityPasswords,
  replaceEntityPasswords,
} from "@/services/entityPasswordService";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isAuthenticated(request);

  const { id } = params;
  const reqBody = await request.json();
  const { entityData, documents, passwords } = splitEntityPayload(reqBody);
  await updateEmployeeEntity(id, entityData);

  if (documents) {
    await replaceEntityDocuments(id, documents);
  }
  if (passwords) {
    await replaceEntityPasswords(id, passwords);
  }

  return Response.json(
    { message: "data updated successfully" },
    { status: 201 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isAuthenticated(request);

  const { id } = params;
  await softDeleteEmployeeEntity(id);
  return Response.json({ message: "data deleted" }, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);

    const employee = (await getEmployeeEntityById(
      params.id,
      true
    )) as TEmployeeData;
    const [documents, passwords] = await Promise.all([
      listEntityDocuments(params.id),
      listEntityPasswords(params.id),
    ]);

    if (!employee) {
      return Response.json({ message: "employee not found" }, { status: 404 });
    }

    const modifiedDocuments = documents.map((document: any) => ({
      _id: document._id,
      name: document.name,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      status: calculateStatus(document.expiryDate),
    }));

    modifiedDocuments.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

    const responseData = {
      id: employee._id,
      name: employee.name,
      company: employee.company,
      emiratesId: employee.emiratesId,
      nationality: employee.nationality,
      phone1: employee.phone1,
      phone2: employee.phone2,
      email: employee.email,
      designation: employee.designation,
      remarks: employee.remarks,
      password: passwords,
      documents: modifiedDocuments,
    };

    return Response.json({ data: responseData }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "Error fetching employee data", error },
      { status: 500 }
    );
  }
}
