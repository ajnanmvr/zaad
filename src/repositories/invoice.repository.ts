import Invoice from "@/models/invoice";

export const InvoiceRepository = {
  create(data: any) {
    return Invoice.create(data);
  },

  findPaginated(query: any, skip: number, limit: number) {
    return Invoice.find(query)
      .populate("createdBy")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  },

  findById(id: string) {
    return Invoice.findById(id).populate("createdBy").lean();
  },

  updateById(id: string, data: any) {
    return Invoice.findByIdAndUpdate(id, data);
  },

  softDelete(id: string) {
    return Invoice.findByIdAndUpdate(id, { published: false });
  },

  findLastInvoice() {
    return Invoice.findOne({ published: true })
      .sort({ createdAt: -1 })
      .select("invoiceNo suffix title")
      .lean();
  },
};
