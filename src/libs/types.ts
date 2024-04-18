export type TUser = {
  id: string;
  username: string;
  password?: string;
  role?: "partner" | "employee";
};
export type TCompanyData = {
  _id?:string;
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
      issueDate: string;
      expiryDate: string;
      attachment: string;
    },
  ];
};
export type TListCompanies = [
  {
    id: string;
    name: string;
    expiryDate: string;
    docs: number;
    status: string;
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
