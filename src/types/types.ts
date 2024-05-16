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
  password?: {
    platform: string;
    username: string;
    password: string;
  }[];
  documents: TDocuments[];
  transactions?: [];
  balance?: number;
  totalIncomes?: number;
  totalExpenses?: number;
};
export type TDocuments = {
  _id: string;
  id?: string;
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

export type TEmployeeList = {
  id: string;
  company: { id: string; name: string };
  name: string;
  expiryDate: string | null;
  docs: number;
  status: "expired" | "renewal" | "valid" | "";
}[];
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
  documents: TDocuments[];
  transactions?: [];
  balance?: number;
  totalIncomes?: number;
  totalExpenses?: number;
};

export type TSuggestions = {
  _id: string;
  name: string;
};
