type TRecordBase = {
  type: string;
  amount: number;
  particular: string;
  category?: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  serviceFee?: number;
  paymentMethodBalancesSnapshot?: Record<string, number>;
  number: number;
  suffix: string;
  method?: string;
  status?: string;
  paymentMethodTemplate?: string;
  paymentStatusTemplate?: string;
  recordKind?:
    | "standard"
    | "company"
    | "self_transfer"
    | "liability"
    | "instant_profit"
    | "office_records";
  transferGroupId?: string;
};

export type TRecordData = TRecordBase & {
  createdBy: string | undefined;
  entity?: string;
  remarks: string;
};
export type TRecordDataWithCreatedAt = TRecordData & {
  createdAt: Date;
};

export type TRecordList = TRecordBase & {
  creator: string;
  creatorFullname?: string;
  id: string;
  employeeName?: string;
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
