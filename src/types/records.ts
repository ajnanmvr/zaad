type TRecordBase = {
  type: string;
  amount: number;
  invoiceNo: string;
  particular: string;
  method?: string;
  status?: string;
  serviceFee?: number;
  number: number;
  suffix: string;
};

export type TRecordData = TRecordBase & {
  createdBy: string | undefined;
  self?: string;
  employee?: string;
  company?: string;
  remarks: string;
  published?: boolean;
};
export type TRecordDataWithCreatedAt = TRecordData & {
  createdAt: Date;
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
  remarks: string;
};
