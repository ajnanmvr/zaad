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
  creatorFullname?: string;
  id: string;
  client: {
    name: string;
    id: string;
    type: string;
    color?: string;
  };
  date: string;
  dateTime?: string;
  createdAt?: string;
  remarks: string;
  version?: number;
  deletedAt?: string;
  deletedBy?: string;
  deletedByFullname?: string;
  activityLog?: {
    action: "create" | "update" | "delete" | "recover";
    at: string;
    byUsername?: string;
    byFullname?: string;
    details?: string;
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
  }[];
};
