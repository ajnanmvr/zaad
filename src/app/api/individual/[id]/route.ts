import connect from "@/db/connect";
import calculateStatus from "@/helpers/calculateStatus";
import Records from "@/models/records";
import { format } from "date-fns";
import Employee from "@/models/employees";
connect();
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const reqBody = await request.json();
  await Employee.findByIdAndUpdate(params.id, reqBody);
  return Response.json(
    { message: "data updated successfully" },
    { status: 201 }
  );
}
interface Employee {
  _id: string;
  name: string;
  emiratesId: string;
  nationality: string;
  phone1: string;
  phone2: string;
  email: string;
  designation: string;
  remarks: string;
  documents: {
    _id: string;
    expiryDate: string;
    name: string;
    issueDate: string;
  }[];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {

  try {
    const employee: Employee | null = await Employee.findById(params.id);

    if (!employee) {
      return Response.json({ message: "employee not found" }, { status: 404 });
    }

    // Modify documents structure
    const modifiedDocuments = employee.documents.map((document) => ({
      _id: document._id,
      name: document.name,
      issueDate: document.issueDate,
      expiryDate: document.expiryDate,
      status: calculateStatus(document.expiryDate),
    }));

    // Sort documents in descending order based on expiryDate
    modifiedDocuments.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );

    const records = await Records.find({
      employee: { _id: params.id },
      published: true,
    }).sort({
      createdAt: -1,
    });

    const transformedData = records.map((record) => ({
      employee: record?.employee?.name,
      type: record.type,
      particular: record.particular,
      invoiceNo: record.invoiceNo,
      self: record?.self,
      amount: Number(
        record.cash + record.bank + record.swiper + record.tasdeed
      ),
      date: format(new Date(record.createdAt), "MMM-dd hh:mma"),
    }));

    // Prepare response data
    const responseData = {
      id: employee._id,
      name: employee.name,
      emiratesId: employee.emiratesId,
      nationality: employee.nationality,
      phone1: employee.phone1,
      phone2: employee.phone2,
      email: employee.email,
      designation: employee.designation,
      remarks: employee.remarks,
      documents: modifiedDocuments,
      transactions: transformedData,
    };

    return Response.json({ data: responseData }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "Error fetching employee data", error },
      { status: 500 }
    );
  }
}
