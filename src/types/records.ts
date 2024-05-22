type TRecordBase = {
  type: string;
  amount: number;
  invoiceNo: string;
  particular: string;
  method?: string;
  status?: string;
  serviceFee?: number;
};

export type TRecordData = TRecordBase & {
  createdBy: string | undefined;
  self?: string;
  employee?: string;
  company?: string;
  remarks: string;
  createdAt?: Date;
};

export type TRecordList = TRecordBase & {
  creator: string;
  id: string;
  client: {
    name: string;
    id: string;
    type: string;
  };
  date: string;
};
