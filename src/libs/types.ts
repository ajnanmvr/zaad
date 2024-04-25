export type TUser = {
  id: string;
  username: string;
  password?: string;
  role?: "partner" | "employee";
};
export type TCompanyData = {
  _id?: string;
  name: string;
  licenseNo?: string;
  companyType?: string;
  emirates?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  transactionNo?: string;
  isMainland?: "mainland" | "freezone";
  remarks?: string;
  password?: [
    {
      platform: string;
      username: string;
      password: string;
    },
  ];
  documents?: [
    {
      name: string;
      status: string;
      issueDate: string;
      expiryDate: string;
      attachment: string;
    },
  ];
  transactions?: TRecordList[];
};
export type TCompanyList = [
  {
    id: string;
    name: string;
    expiryDate: string | null;
    docs: number;
    status: "expired" | "renewal" | "valid" | "";
  },
];
export type TEmployeeList = [
  {
    id: string;
    company: { id: string; name: string };
    name: string;
    expiryDate: string | null;
    docs: number;
    status: "expired" | "renewal" | "valid" | "";
  },
];
export type TEmployeeData = {
  name: string;
  company: TCompanyData;
  isActive: boolean;
  emiratesId?: string;
  nationality?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  designation?: string;
  remarks?: string;
  documents?: [
    {
      name: string;
      issueDate: string;
      expiryDate: string;
      attachment: string;
    },
  ];
};

export type TRecordData = {
  type: string;
  cash: number;
  bank: number;
  swiper: number;
  tasdeed: number;
  self?: string;
  invoiceNo: string;
  particular: string;
  employee?: string;
  company?: string;
  remarks: string;
};

export type TSuggestions = {
  _id: string;
  name: string;
};

export type TRecordList = {
  id?:string;
  title?:string;
  desc?:string;
  type: string;
  amount: number;
  self?: string;
  invoiceNo: string;
  particular: string;
  employee?: string;
  company?: string;
  date: string;
};
