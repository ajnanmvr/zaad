import { RecordsRepository } from "@/repositories/records.repository";
import { TRecordData } from "@/types/records";
import {
  transformRecord,
  calculateBalance,
  calculateRecordTotals,
  emptyRecordsSummary,
} from "@/utils/records.utils";
import { sliceCursorData } from "@/utils/pagination.utils";
import connect from "@/db/mongo";

class RecordsServiceClass {
  async getCompanyBalance(companyId: string) {
    await connect();
    const records: TRecordData[] =
      (await RecordsRepository.findPublishedByCompany(companyId)) as any[];
    const balance = calculateBalance(records as any[]);
    return { balance };
  }

  async getEmployeeBalance(employeeId: string) {
    await connect();
    const records: any[] = await RecordsRepository.findWithFiltersPaginated(
      { published: true, employee: employeeId },
      0,
      Number.MAX_SAFE_INTEGER
    );
    const balance = calculateBalance(records);
    return { balance };
  }

  async createRecord(data: any) {
    await connect();
    return RecordsRepository.create(data);
  }

  async listRecords(
    method: string | null,
    type: string | null,
    pageNumber: number,
    pageSize = 25
  ) {
    await connect();
    const filters: any = { published: true };
    if (method) filters.method = method;
    if (type) filters.type = type;

    const records = await RecordsRepository.findWithFiltersPaginated(
      filters,
      pageNumber * pageSize,
      pageSize + 1
    );

    const { data, hasMore } = sliceCursorData(records, pageSize);
    const transformedData = data.map(transformRecord);

    return { count: transformedData.length, hasMore, records: transformedData };
  }

  async getRecord(id: string) {
    await connect();
    return RecordsRepository.findById(id);
  }

  async updateRecord(id: string, data: any) {
    await connect();
    return RecordsRepository.updateById(id, { ...data, edited: true });
  }

  async deleteRecord(id: string) {
    await connect();
    return RecordsRepository.softDelete(id);
  }

  async getCompanyRecordsSummary(companyId: string) {
    await connect();
    const records = await RecordsRepository.findWithFiltersPaginated(
      { published: true, company: { _id: companyId } },
      0,
      Number.MAX_SAFE_INTEGER
    );

    if (!records || records.length === 0) {
      return emptyRecordsSummary();
    }

    const transformedData = records.map(transformRecord);
    const { totalIncome, totalExpense, balance } =
      calculateRecordTotals(records);

    return {
      count: transformedData.length,
      records: transformedData,
      balance,
      totalIncome,
      totalExpense,
      totalTransactions: records.length,
    };
  }

  async getEmployeeRecordsSummary(employeeId: string) {
    await connect();
    const records = await RecordsRepository.findWithFiltersPaginated(
      { published: true, employee: { _id: employeeId } },
      0,
      Number.MAX_SAFE_INTEGER
    );

    if (!records || records.length === 0) {
      return emptyRecordsSummary();
    }

    const transformedData = records.map(transformRecord);
    const { totalIncome, totalExpense, balance } =
      calculateRecordTotals(records);

    return {
      count: transformedData.length,
      records: transformedData,
      balance,
      totalIncome,
      totalExpense,
      totalTransactions: records.length,
    };
  }

  async getSelfRecordsSummary(selfName: string, pageNumber: number, pageSize = 10) {
    const records = await RecordsRepository.findWithFiltersPaginated(
      { published: true, self: selfName },
      pageNumber * pageSize,
      pageSize + 1
    );

    if (!records || records.length === 0) {
      return { ...emptyRecordsSummary(false), hasMore: false };
    }

    const { data, hasMore } = sliceCursorData(records, pageSize);
    const transformedData = data.map(transformRecord);

    // Fetch all records for totals
    const allRecords = await RecordsRepository.findWithFiltersPaginated(
      { published: true, self: selfName },
      0,
      Number.MAX_SAFE_INTEGER
    );

    const { totalIncome, totalExpense, balance } =
      calculateRecordTotals(allRecords);

    return {
      count: transformedData.length,
      hasMore,
      records: transformedData,
      balance,
      totalIncome,
      totalExpense,
      totalTransactions: allRecords.length,
    };
  }

  async createInstantProfit(reqBody: any) {
    await connect();
    await RecordsRepository.create(reqBody);
    let { amount, number, type, method, ...rest } = reqBody;
    const serviceFee = amount;
    amount = 0;
    type = "expense";
    method = "service fee";
    number = +number + 1;
    await RecordsRepository.create({
      serviceFee,
      amount,
      type,
      method,
      number,
      ...rest,
    });
  }

  async getPrevSuffixNumber() {
    await connect();
    const last = await RecordsRepository.findLastSuffixAndNumber();
    return { suffix: (last as any)?.suffix, number: (last as any)?.number || 0 };
  }

  async swapAccounts(
    amount: number,
    createdBy: string,
    to: string,
    from: string
  ) {
    await connect();
    const last = await RecordsRepository.findLastSuffixAndNumber();
    const newSuffix = (last as any)?.suffix || "";
    const newNumber = (last as any)?.number || 0;

    await RecordsRepository.create({
      createdBy,
      type: "expense",
      amount,
      suffix: newSuffix,
      number: newNumber + 1,
      particular: `Money removed from ${from} to add in ${to}`,
      self: "Zaad (Self Deposit)",
      status: "Self Deposit",
      method: from,
    });

    await RecordsRepository.create({
      createdBy,
      type: "income",
      amount,
      suffix: newSuffix,
      number: newNumber + 2,
      particular: `Money recieved as exchange from ${from}`,
      self: "Zaad (Self Deposit)",
      status: "Self Deposit",
      method: to,
    });
  }

  async getLiabilitiesSummary() {
    const records = await RecordsRepository.findWithFiltersPaginated(
      {
        published: true,
        $or: [{ method: "liability" }, { status: "liability" }],
      },
      0,
      Number.MAX_SAFE_INTEGER
    );

    if (!records || records.length === 0) {
      return {
        message: "No records found",
        count: 0,
        records: [],
        amount: 0,
      };
    }

    interface ClientData {
      client: { name: string; id: string; type: "company" | "employee" };
      income: number;
      expense: number;
    }
    const grouped: Record<string, ClientData> = {};

    (records as any).forEach((record: any) => {
      const client: {
        name: string;
        id: string;
        type: "company" | "employee";
      } | null = (() => {
        const { company, employee } = record;
        return company
          ? { name: company.name, id: company._id, type: "company" }
          : employee
          ? { name: employee.name, id: employee._id, type: "employee" }
          : null;
      })();

      if (client) {
        if (!grouped[client.id]) {
          grouped[client.id] = { client, income: 0, expense: 0 };
        }
        if (record.type === "income") grouped[client.id].income += record.amount;
        else if (record.type === "expense")
          grouped[client.id].expense += record.amount;
      }
    });

    const transformedData = Object.values(grouped).map((data) => ({
      client: data.client,
      netAmount: data.income - data.expense,
    }));

    const amount = transformedData.reduce((acc, d) => acc + d.netAmount, 0);
    return {
      message: "Records retrieved successfully",
      count: (records as any).length,
      records: transformedData,
      amount,
    };
  }

  async getAccountsSummary(filter: any, searchParamsEmpty: boolean) {
    const allRecords: any[] = await RecordsRepository.findWithFiltersPaginated(
      filter,
      0,
      Number.MAX_SAFE_INTEGER
    );
    const expenseRecords = allRecords.filter((r) => r.type === "expense");
    const incomeRecords = allRecords.filter((r) => r.type === "income");

    const expenseCount = expenseRecords.length;
    const incomeCount = incomeRecords.length;

    let BankExpense = 0,
      CashExpense = 0,
      TasdeedExpense = 0,
      SwiperExpense = 0,
      BankIncome = 0,
      CashIncome = 0,
      TasdeedIncome = 0,
      SwiperIncome = 0,
      profit = 0;

    incomeRecords.forEach((record) => {
      switch (record.method) {
        case "bank":
          BankIncome += record.amount || 0;
          break;
        case "cash":
          CashIncome += record.amount || 0;
          break;
        case "tasdeed":
          TasdeedIncome += record.amount || 0;
          break;
        case "swiper":
          SwiperIncome += record.amount || 0;
          break;
        default:
          break;
      }
    });

    expenseRecords.forEach((record) => {
      switch (record.method) {
        case "bank":
          BankExpense += record.amount || 0;
          break;
        case "cash":
          CashExpense += record.amount || 0;
          break;
        case "tasdeed":
          TasdeedExpense += record.amount || 0;
          break;
        case "swiper":
          SwiperExpense += record.amount || 0;
          break;
        default:
          break;
      }
      if ((record?.serviceFee || 0) > 0) {
        profit += record.serviceFee || 0;
      }
    });

    const zaadExpenseTotal = parseFloat(
      expenseRecords
        .filter((r) => r?.self === "zaad")
        .reduce((t, r) => t + (r.amount || 0), 0)
        .toFixed(2)
    );
    const netProfit = parseFloat((profit - zaadExpenseTotal).toFixed(2));

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const last7DaysDates: Date[] = [];
    const daysOfWeekInitials: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
      last7DaysDates.push(date);
      const dayInitial = date.toLocaleString("en-US", { weekday: "short" })[0].toUpperCase();
      daysOfWeekInitials.push(dayInitial);
    }

    const { default: calculateLast12Months } = await import(
      "@/helpers/calculateLast12Months"
    );
    const { default: calculateLast12MonthsTotals } = await import(
      "@/helpers/calculateLast12MonthsTotals"
    );
    const { default: calculateLast7Days } = await import(
      "@/helpers/calculateLast7Days"
    );

    const [expensesLast7DaysTotal, profitLast7DaysTotal] = calculateLast7Days(
      expenseRecords as any,
      last7DaysDates
    );
    const last12Months = calculateLast12Months(currentDate, currentYear);
    const [last12MonthsExpenses, last12MonthsProfit] =
      await calculateLast12MonthsTotals(expenseRecords as any, last12Months);

    const monthNames = last12Months.map(({ name }) => name);
    const totalIncomeAmount =
      BankIncome + CashIncome + TasdeedIncome + SwiperIncome;
    const totalExpenseAmount =
      BankExpense + CashExpense + TasdeedExpense + SwiperExpense;
    const totalBalance = totalIncomeAmount - totalExpenseAmount;
    const bankBalance =
      BankIncome - BankExpense + (SwiperIncome - SwiperExpense);
    const cashBalance = CashIncome - CashExpense;
    const tasdeedBalance = TasdeedIncome - TasdeedExpense;

    return {
      expenseCount,
      incomeCount,
      totalIncomeAmount,
      totalExpenseAmount,
      totalBalance,
      bankBalance,
      cashBalance,
      tasdeedBalance,
      BankIncome,
      CashIncome,
      TasdeedIncome,
      SwiperIncome,
      BankExpense,
      CashExpense,
      TasdeedExpense,
      SwiperExpense,
      daysOfWeekInitials,
      expensesLast7DaysTotal,
      profitLast7DaysTotal,
      last12Months,
      monthNames,
      last12MonthsExpenses,
      last12MonthsProfit,
      profit,
      zaadExpenseTotal,
      netProfit,
    };
  }
}

export const RecordsService = new RecordsServiceClass();