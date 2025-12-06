import connect from "@/db/mongo";
import calculateStatus from "@/utils/calculateStatus";
import Employee from "@/models/employees";
import { TEmployeeData } from "@/types/types";
import { NextRequest } from "next/server";
import { isAuthenticated } from "@/helpers/isAuthenticated";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isAuthenticated(request);

  const { id } = params;
  const reqBody = await request.json();
  await Employee.findByIdAndUpdate(id, reqBody);
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
  await Employee.findByIdAndUpdate(id, { published: false });
  return Response.json({ message: "data deleted" }, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    await isAuthenticated(request);

    const employee = (await Employee.findById(params.id).populate(
      "company"
    )) as TEmployeeData;

    if (!employee) {
      return Response.json({ message: "employee not found" }, { status: 404 });
    }

    const modifiedDocuments = employee.documents.map((document) => ({
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
      password: employee.password,
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
