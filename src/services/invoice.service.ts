import { InvoiceRepository } from "@/repositories/invoice.repository";
import formatDate from "@/utils/formatDate";
import { calculateInvoiceAmount } from "@/utils/invoice.utils";
import { buildQuery, sliceCursorData } from "@/utils/pagination.utils";
import { serializeObjectIds } from "@/utils/serialization";
import connect from "@/db/mongo";

const PAGE_SIZE = 10;

class InvoiceServiceClass {
  async createInvoice(data: any) {
    await connect();
    return InvoiceRepository.create(data);
  }

  async listInvoices(search: string | null, page: number) {
    await connect();
    const query = buildQuery(true, search, ["client", "purpose"]);

    const invoices = await InvoiceRepository.findPaginated(
      query,
      page * PAGE_SIZE,
      PAGE_SIZE + 1
    );

    const { data, hasMore } = sliceCursorData(invoices, PAGE_SIZE);

    return {
      hasMore,
      invoices: data.map((invoice) => ({
        id: invoice._id?.toString() || invoice._id,
        client: serializeObjectIds(invoice.client),
        purpose: invoice.purpose,
        invoiceNo: invoice.suffix + invoice.invoiceNo,
        amount: calculateInvoiceAmount(invoice.items),
        date: formatDate(invoice.date),
      })),
    };
  }

  async getInvoiceById(id: string, editMode: boolean) {
    await connect();
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw new Error("Invoice not found");

    const serializedItems = invoice.items?.map((item: any) => ({
      ...item,
      _id: item._id?.toString() || item._id,
    })) || [];

    const common = {
      items: serializedItems,
      remarks: invoice.remarks,
      advance: invoice.advance,
      purpose: invoice.purpose,
      location: invoice.location,
      client: invoice.client,
      title: invoice.title,
      trn: invoice.trn,
      quotation: invoice.quotation,
      message: invoice.message,
      showBalance: invoice.showBalance,
    };

    if (!editMode) {
      return {
        invoiceNo: invoice.suffix + invoice.invoiceNo,
        creator: invoice.createdBy?.username ?? "Unknown",
        amount: calculateInvoiceAmount(invoice.items),
        date: formatDate(invoice.date),
        validTo: formatDate(invoice.validTo),
        ...common,
      };
    }

    return {
      suffix: invoice.suffix,
      invoiceNo: invoice.invoiceNo,
      createdBy: invoice.createdBy?._id?.toString() || invoice.createdBy?._id || null,
      date: invoice.date,
      validTo: invoice.validTo,
      ...common,
    };
  }

  async updateInvoice(id: string, data: any) {
    await connect();
    return InvoiceRepository.updateById(id, data);
  }

  async deleteInvoice(id: string) {
    await connect();
    return InvoiceRepository.softDelete(id);
  }

  async getNextInvoiceNo() {
    await connect();
    const last = await InvoiceRepository.findLastInvoice();
    if (!last) return { invoiceNo: 1, suffix: "", title: "" };

    return {
      suffix: last.suffix,
      invoiceNo: last.invoiceNo + 1,
      title: last.title,
    };
  }
}

export const InvoiceService = new InvoiceServiceClass();
