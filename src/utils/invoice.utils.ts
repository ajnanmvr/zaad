import { TInvoiceItemsData } from "@/types/invoice";

export const calculateInvoiceAmount = (items: TInvoiceItemsData[]) =>
  items.reduce(
    (acc, item) => acc + item.rate * item.quantity,
    0
  );