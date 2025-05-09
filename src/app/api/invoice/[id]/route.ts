import Invoice from "@/models/invoice";
import connect from "@/db/connect";
import { TInvoiceItemsData } from "@/types/invoice";
import formatDate from "@/utils/formatDate";
import { NextRequest } from "next/server";
export async function DELETE(
  request:NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const { id } = params;
  await Invoice.findByIdAndUpdate(id, { published: false });
  return Response.json({ message: "data deleted" }, { status: 200 });
}

export async function PUT(
  request:NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  const { id } = params;
  const reqBody = await request.json();
  await Invoice.findByIdAndUpdate(id, reqBody);
  return Response.json(
    { message: "data updated successfully" },
    { status: 201 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connect();
    const searchParams = request.nextUrl.searchParams;
    const editmode = searchParams.get("editmode");
    const res = await Invoice.findById(params.id).populate("createdBy");
    const {
      client,
      title,
      suffix,
      invoiceNo,
      createdBy,
      date,
      validTo,
      items,
      remarks,
      purpose,
      location,
      advance,
      trn,
      quotation,
      message,
      showBalance
    } = res;

    const commonData = {
      items,
      remarks,
      advance,
      purpose,
      location,
      client,
      title,
      trn,
      quotation,
      message,
      showBalance
    };
    const data =
      editmode === null
        ? {
            invoiceNo: suffix + invoiceNo,
            creator: createdBy.username,
            amount: items.reduce(
              (acc: number, item: TInvoiceItemsData) =>
                acc + item.rate * item.quantity,
              0
            ),
            date: formatDate(date),
            validTo: formatDate(validTo),
            ...commonData,
          }
        : {
            suffix,
            invoiceNo,
            createdBy: createdBy._id,
            date: date || new Date(),
            validTo,
            ...commonData,
          };

    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: "Error fetching employee data", error },
      { status: 500 }
    );
  }
}
