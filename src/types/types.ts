export type TUser = {
  id: string;
  username: string;
  password?: string;
  fullname?: string;
  role?: string;
};
export type TPasswordData = {
  category?: string;
  platform: string;
  username: string;
  credential?: string;
  password?: string;
};
export type TCompanyData = {
  _id?: string;
  name: string;
  entityType?: "company" | "employee" | "individual";
  licenseNo?: string;
  companyType?: string;
  emirates?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  transactionNo?: string;
  isMainland?: "mainland" | "freezone";
  remarks?: string;
  credentials?: TPasswordData[];
  password?: TPasswordData[];
  documents?: TDocuments[];
  transactions?: [];
  balance?: number;
  totalIncomes?: number;
  totalExpenses?: number;
};
export type TDocuments = {
  _id: string;
  id?: string;
  category?: string;
  name?: string;
  status?: string;
  issueDate?: string;
  expiryDate: string;
  attachment?: string;
};

export type TCompanyList = {
  id?: string;
  name: string;
  expiryDate: string | null;
  docs: number;
  status?: "expired" | "renewal" | "valid" | "unknown";
};

export type TBaseData = {
  _id?: string;
  name: string;
};

export type TEmployeeList = TCompanyList & {
  company: TBaseData;
};

export type TEntityListItem = {
  id: string;
  name: string;
  entityType: "company" | "employee" | "individual";
  createdAt?: string;
  company?: TBaseData;
};

export type TPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TPaginatedResponse<T> = {
  data: T[];
  pagination: TPagination;
};

export type TExpiryDocumentItem = {
  id: string;
  category?: string;
  name?: string;
  issueDate?: string;
  expiryDate?: string;
  attachment?: string;
  status: "valid" | "expired" | "renewal" | "unknown";
  daysLeft: number | null;
  entity: {
    id: string;
    name: string;
    entityType: "company" | "employee" | "individual";
  };
};

export type TEmployeeData = {
  _id: string;
  name: string;
  entityType?: "employee" | "individual";
  credentials?: TPasswordData[];
  password?: TPasswordData[];
  company?: TCompanyData;
  isActive: boolean;
  emiratesId?: string;
  nationality?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  designation?: string;
  remarks?: string;
  documents?: TDocuments[];
  transactions?: [];
  balance?: number;
  totalIncomes?: number;
  totalExpenses?: number;
};

export type TIndividualData = Omit<TEmployeeData, "company" | "entityType"> & {
  entityType?: "individual";
  company?: undefined;
};
