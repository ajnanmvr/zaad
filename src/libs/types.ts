export type TUser = {
  id:string;  username: string;
  password?: string;
  role?: "partner" | "employee";
};
