export type TInvoiceData = {
  title: string;
  suffix: string;
  quotation: string;
  message: string;
  invoiceNo: string;
  trn: string;
  createdBy: string;
  client: string;
  entityId?: string | null;
  entityType?: "company" | "employee" | "individual" | null;
  date: string;
  validTo: string;
  items: TInvoiceItemsData[];
  remarks: string;
  advance: number;
  location: string;
  purpose: string;
  amount: number;
  showBalance:string,
  balance: number;
};
export type TInvoiceList = {
  id: string;
  purpose: string;
  invoiceNo: string;
  client: string;
  entityId?: string | null;
  entityType?: "company" | "employee" | "individual" | null;
  entityColor?: string | null;
  entityName?: string | null;
  amount: number;
  date: string;
};

export type TInvoiceItemsData = {
  title: string;
  desc: string;
  rate: number;
  quantity: number;
};
