import { InvoiceRepository } from "@/repositories/invoice.repository";
import { calculateInvoiceAmount } from "@/utils/invoice.utils";
import formatDate from "@/utils/formatDate";

const PAGE_SIZE = 10;

export const InvoiceService = {
  async createInvoice(data: any) {
    return InvoiceRepository.create(data);
  },

  async listInvoices(search: string | null, page: number) {
    const query: any = { published: true };

    if (search) {
      query.$or = [
        { client: { $regex: search, $options: "i" } },
        { purpose: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await InvoiceRepository.findPaginated(
      query,
      page * PAGE_SIZE,
      PAGE_SIZE + 1
    );

    const hasMore = invoices.length > PAGE_SIZE;

    const data = invoices.slice(0, PAGE_SIZE).map((invoice) => ({
      id: invoice._id,
      client: invoice.client,
      purpose: invoice.purpose,
      invoiceNo: invoice.suffix + invoice.invoiceNo,
      amount: calculateInvoiceAmount(invoice.items),
      date: formatDate(invoice.date),
    }));

    return { hasMore, invoices: data };
  },

  async getInvoiceById(id: string, editMode: boolean) {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw new Error("Invoice not found");

    const common = {
      items: invoice.items,
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
      createdBy: invoice.createdBy?._id ?? null,
      date: invoice.date,
      validTo: invoice.validTo,
      ...common,
    };
  },

  async updateInvoice(id: string, data: any) {
    return InvoiceRepository.updateById(id, data);
  },

  async deleteInvoice(id: string) {
    return InvoiceRepository.softDelete(id);
  },

  async getNextInvoiceNo() {
    const last = await InvoiceRepository.findLastInvoice();
    if (!last) return { invoiceNo: 1, suffix: "", title: "" };

    return {
      suffix: last.suffix,
      invoiceNo: last.invoiceNo + 1,
      title: last.title,
    };
  },
};
