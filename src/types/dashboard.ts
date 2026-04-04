export type TAccountsData = {
  summary?: {
    income?: Record<string, number>;
    expense?: Record<string, number>;
  };
  expenseCount: number;
  totalExpenseAmount: number;
  incomeCount: number;
  totalIncomeAmount: number;
  totalBalance: number;
  bankBalance: number;
  cashBalance: number;
  tasdeedBalance: number;
  BankIncome: number;
  CashIncome: number;
  TasdeedIncome: number;
  SwiperIncome: number;
  BankExpense: number;
  CashExpense: number;
  TasdeedExpense: number;
  SwiperExpense: number;
  profit: number;
  netProfit: number;
  zaadExpenseTotal: number;
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
