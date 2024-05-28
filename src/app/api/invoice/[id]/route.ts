import Invoice from "@/models/invoice";
import connect from "@/db/connect";
import { TInvoiceItemsData } from "@/types/invoice";
import formatDate from "@/utils/formatDate";
connect();
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  await Invoice.findByIdAndUpdate(id, { published: false });
  return Response.json({ message: "data deleted" }, { status: 200 });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const reqBody = await request.json();
  await Invoice.findByIdAndUpdate(id, reqBody);
  return Response.json(
    { message: "data updated successfully" },
    { status: 201 }
  );
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const res = await Invoice.findById(params.id).populate([
      "createdBy",
      "company",
      "employee",
    ]);
    const {
      company,
      employee,
      other,
      title,
      suffix,
      invoiceNo,
      createdBy,
      date,
      items,
      remarks,
    } = res;
    const client = () => {
      return company
        ? { name: company.name, id: company._id, type: "company" }
        : employee
          ? { name: employee.name, id: employee._id, type: "employee" }
          : other
            ? { name: other, type: "other" }
            : null;
    };
    const data = {
      title,
      invoiceNo: suffix + invoiceNo,
      client: client(),
      creator: createdBy.username,
      amount: items.reduce(
        (acc: number, item: TInvoiceItemsData) =>
          acc + item.rate * item.quantity,
        0
      ),
      items,
      date: formatDate(date),
      remarks,
    };

    return Response.json( res , { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "Error fetching employee data", error },
      { status: 500 }
    );
  }
}
