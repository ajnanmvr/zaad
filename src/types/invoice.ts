export type TInvoiceData = {
  title: string;
  suffix: string;
  invoiceNo: string;
  company: string;
  employee: string;
  createdBy: string;
  date: string;
  items: TInvoiceItemsData[];
  remarks: string;
  advance: number;
  location: string;
  purpose: string;
};
export type TInvoiceList = {
  id: string;
  purpose: string;
  invoiceNo: string;
  client: {
    name: string;
    id?: string;
    type: string;
  };
  amount: number;
  date: string;
};

export type TInvoiceItemsData = {
  title: string;
  desc: string;
  rate: number;
  quantity: number;
};
