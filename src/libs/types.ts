export type TUser = {
  username: string;
  email: string;
  password: string;
  isVerified?: Boolean;
  role?: "user" | "admin";
  forgotPasswordToken?: String;
  forgotPasswordTokenExpiry?: Date;
  verifyToken?: String;
  verifyTokenExpiry?: Date;
};
