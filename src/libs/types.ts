export type TUser = {
  id: string;
  username: string;
  password?: string;
  role?: "partner" | "employee";
};
export type TCompanyData = {
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
      issueDate: Date;
      expiryDate: Date;
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
  },
];
