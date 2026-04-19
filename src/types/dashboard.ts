export type TAccountsData = {
  summary?: {
    income?: Record<string, number>;
    expense?: Record<string, number>;
  };
  methodBreakdown?: {
    method: string;
    income: number;
    expense: number;
    balance: number;
  }[];
  methodBalances?: Record<string, number>;
  expenseCount: number;
  totalExpenseAmount: number;
  incomeCount: number;
  totalIncomeAmount: number;
  totalBalance: number;
  bankBalance?: number;
  cashBalance?: number;
  tasdeedBalance?: number;
  BankIncome?: number;
  CashIncome?: number;
  TasdeedIncome?: number;
  SwiperIncome?: number;
  BankExpense?: number;
  CashExpense?: number;
  TasdeedExpense?: number;
  SwiperExpense?: number;
  profit: number;
  grossProfit: number;
  netProfit: number;
  profitAfterOfficeExpenses: number;
  zaadExpenseTotal: number;
  dailyTrend?: {
    date: string;
    income: number;
    expense: number;
  }[];
  monthlyTrend?: {
    month: string;
    income: number;
    expense: number;
  }[];
  statusBreakdown?: {
    status: string;
    income: number;
    expense: number;
    total: number;
  }[];
  topEntities?: {
    key: string;
    label: string;
    entityType: "company" | "employee" | "self" | "unknown";
    income: number;
    expense: number;
    balance: number;
    volume: number;
  }[];
};

export type TProfitsData = {
  over0balanceCompanies: { name: string; balance: number; id: string }[];
  under0balanceCompanies: { name: string; balance: number; id: string }[];
  totalProfitAllCompanies: number;
  totalToGiveCompanies: number;
  totalToGetCompanies: number;
  over0balanceEmployees: { name: string; balance: number; id: string }[];
  under0balanceEmployees: { name: string; balance: number; id: string }[];
  totalProfitAllEmployees: number;
  totalToGiveEmployees: number;
  totalToGetEmployees: number;
  profit: number;
  totalToGive: number;
  totalToGet: number;
};

export type TDashboardOverview = {
  counts: {
    companies: number;
    employees: number;
    individuals: number;
  };
  documentStats: {
    total: number;
    expired: number;
    renewal: number;
    valid: number;
    renewedThisMonth: number;
    expiringNext30Days: number;
  };
  monthlyRenewals: {
    month: string;
    count: number;
  }[];
  categoryRenewals?: {
    category: string;
    count: number;
  }[];
  categoryExpiryRenewalBreakdown?: {
    category: string;
    expired: number;
    renewal: number;
  }[];
  upcomingTasks: {
    id: string;
    title: string;
    status: "todo" | "in_progress" | "completed" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent";
    dueDate?: string | null;
  }[];
  taskSummary: {
    open: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
};
