export type TAccountsData= {
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
    last12MonthsExpenses: number[];
    last12MonthsProfit: number[];
    monthNames: string[];
    profitLast7DaysTotal: number[];
    expensesLast7DaysTotal: number[];
    daysOfWeekInitials: string[];
    profit: number;
  }

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
  }