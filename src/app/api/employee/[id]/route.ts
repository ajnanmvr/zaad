import connect from "@/db/connect";
import calculateStatus from "@/utils/calculateStatus";
import Records from "@/models/records";
import Employee from "@/models/employees";
import { TEmployeeData } from "@/types/types";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connect();
  const { id } = params;
  const reqBody = await request.json();
  await Employee.findByIdAndUpdate(id, reqBody);
  return Response.json(
    { message: "data updated successfully" },
    { status: 201 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await connect();

  const { id } = params;
  await Employee.findByIdAndUpdate(id, { published: false });
  return Response.json({ message: "data deleted" }, { status: 200 });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connect();

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
