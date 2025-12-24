import connect from "@/db/mongo";
import { isPartner } from "@/helpers/isAuthenticated";
import { NextRequest } from "next/server";
import { RecordsService } from "@/services/records.service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isPartner(request);
  const { id } = params;
  await RecordsService.deleteRecord(id);
  return Response.json({ message: "data deleted" }, { status: 200 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isPartner(request);
  try {
    const { id } = params;
    const data = await RecordsService.getRecord(id);
    return Response.json(data, { status: 200 });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await connect();
  await isPartner(request);
  const { id } = params;
  try {
    const reqBody = await request.json();
    const data = await RecordsService.updateRecord(id, reqBody);
    return Response.json({ message: "data updated", data }, { status: 200 });
  } catch (error) {
    return Response.json(error, { status: 401 });
  }
}
