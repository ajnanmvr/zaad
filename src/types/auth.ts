export const UserRole = {
  ADMIN: "admin",
  MANAGER: "manager",
  ACCOUNTANT: "accountant",
  EMPLOYEE: "employee",
  USER: "user",
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface RolePermission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface RolePermissions {
  companies: RolePermission;
  employees: RolePermission;
  individuals: RolePermission;
  documents: RolePermission;
  invoices: RolePermission;
  liabilities: RolePermission;
  records: RolePermission;
  tasks: RolePermission;
  users: RolePermission;
  zaadExpenses: RolePermission;
  reports: RolePermission;
  settings: RolePermission;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    companies: { create: true, read: true, update: true, delete: true },
    employees: { create: true, read: true, update: true, delete: true },
    individuals: { create: true, read: true, update: true, delete: true },
    documents: { create: true, read: true, update: true, delete: true },
    invoices: { create: true, read: true, update: true, delete: true },
    liabilities: { create: true, read: true, update: true, delete: true },
    records: { create: true, read: true, update: true, delete: true },
    tasks: { create: true, read: true, update: true, delete: true },
    users: { create: true, read: true, update: true, delete: true },
    zaadExpenses: { create: true, read: true, update: true, delete: true },
    reports: { create: true, read: true, update: true, delete: true },
    settings: { create: true, read: true, update: true, delete: true },
  },
  manager: {
    companies: { create: true, read: true, update: true, delete: false },
    employees: { create: true, read: true, update: true, delete: false },
    individuals: { create: true, read: true, update: true, delete: false },
    documents: { create: true, read: true, update: true, delete: false },
    invoices: { create: true, read: true, update: true, delete: false },
    liabilities: { create: true, read: true, update: true, delete: false },
    records: { create: true, read: true, update: true, delete: false },
    tasks: { create: true, read: true, update: true, delete: true },
    users: { create: false, read: true, update: false, delete: false },
    zaadExpenses: { create: true, read: true, update: true, delete: false },
    reports: { create: true, read: true, update: false, delete: false },
    settings: { create: false, read: true, update: false, delete: false },
  },
  accountant: {
    companies: { create: false, read: true, update: false, delete: false },
    employees: { create: false, read: true, update: false, delete: false },
    individuals: { create: false, read: true, update: false, delete: false },
    documents: { create: true, read: true, update: true, delete: false },
    invoices: { create: true, read: true, update: true, delete: false },
    liabilities: { create: true, read: true, update: true, delete: false },
    records: { create: true, read: true, update: true, delete: false },
    tasks: { create: false, read: true, update: false, delete: false },
    users: { create: false, read: false, update: false, delete: false },
    zaadExpenses: { create: true, read: true, update: true, delete: false },
    reports: { create: true, read: true, update: false, delete: false },
    settings: { create: false, read: false, update: false, delete: false },
  },
  employee: {
    companies: { create: false, read: true, update: false, delete: false },
    employees: { create: false, read: true, update: false, delete: false },
    individuals: { create: false, read: true, update: false, delete: false },
    documents: { create: false, read: true, update: false, delete: false },
    invoices: { create: false, read: true, update: false, delete: false },
    liabilities: { create: false, read: true, update: false, delete: false },
    records: { create: false, read: true, update: false, delete: false },
    tasks: { create: false, read: true, update: true, delete: false },
    users: { create: false, read: false, update: false, delete: false },
    zaadExpenses: { create: false, read: true, update: false, delete: false },
    reports: { create: false, read: true, update: false, delete: false },
    settings: { create: false, read: false, update: false, delete: false },
  },
  user: {
    companies: { create: false, read: true, update: false, delete: false },
    employees: { create: false, read: true, update: false, delete: false },
    individuals: { create: false, read: true, update: false, delete: false },
    documents: { create: false, read: true, update: false, delete: false },
    invoices: { create: false, read: true, update: false, delete: false },
    liabilities: { create: false, read: true, update: false, delete: false },
    records: { create: false, read: true, update: false, delete: false },
    tasks: { create: false, read: true, update: false, delete: false },
    users: { create: false, read: false, update: false, delete: false },
    zaadExpenses: { create: false, read: true, update: false, delete: false },
    reports: { create: false, read: false, update: false, delete: false },
    settings: { create: false, read: false, update: false, delete: false },
  },
};

export const checkPermission = (
  userRole: UserRole | undefined,
  resource: keyof RolePermissions,
  action: keyof RolePermission
): boolean => {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions || !permissions[resource]) return false;
  return permissions[resource][action];
};
