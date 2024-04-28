import connect from "@/db/connect";
import Records from "@/models/records";

connect();
export async function GET() {
  try {
    const [
      expenseCount,
      BankExpense,
      CashExpense,
      TaseedExpense,
      SwiperExpense,
      totalProfitAmount,
    ] = await Promise.all([
      Records.countDocuments({ type: "expense", published: true }),
      Records.aggregate([
        { $match: { type: "expense", published: true } },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$bank",
            },
          },
        },
      ]).then((result) => (result.length > 0 ? result[0].total : 0)),
      Records.aggregate([
        { $match: { type: "expense", published: true } },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$cash",
            },
          },
        },
      ]).then((result) => (result.length > 0 ? result[0].total : 0)),
      Records.aggregate([
        { $match: { type: "expense", published: true } },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$tasdeed",
            },
          },
        },
      ]).then((result) => (result.length > 0 ? result[0].total : 0)),
      Records.aggregate([
        { $match: { type: "expense", published: true } },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$swiper",
            },
          },
        },
      ]).then((result) => (result.length > 0 ? result[0].total : 0)),
      Records.aggregate([
        { $match: { type: "expense", published: true } },
        {
          $group: {
            _id: null,
            total: {
              $sum: { $add: ["$serviceFee"] },
            },
          },
        },
      ]).then((result) => (result.length > 0 ? result[0].total : 0)),
    ]);
    const [incomeCount, BankIncome, CashIncome, TaseedIncome, SwiperIncome] =
      await Promise.all([
        Records.countDocuments({ type: "income", published: true }),

        Records.aggregate([
          { $match: { type: "income", published: true } },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$bank",
              },
            },
          },
        ]).then((result) => (result.length > 0 ? result[0].total : 0)),
        Records.aggregate([
          { $match: { type: "income", published: true } },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$cash",
              },
            },
          },
        ]).then((result) => (result.length > 0 ? result[0].total : 0)),
        Records.aggregate([
          { $match: { type: "income", published: true } },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$tasdeed",
              },
            },
          },
        ]).then((result) => (result.length > 0 ? result[0].total : 0)),
        Records.aggregate([
          { $match: { type: "income", published: true } },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$swiper",
              },
            },
          },
        ]).then((result) => (result.length > 0 ? result[0].total : 0)),
      ]);

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Calculate total expenses of the past 7 days
    const last7DaysDates = [];
    const daysOfWeekInitials = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
      last7DaysDates.push(date);
      const dayInitial = date
        .toLocaleString("en-US", { weekday: "short" })[0]
        .toUpperCase();
      daysOfWeekInitials.push(dayInitial);
    }

    // Fetch expenses and incomes for the last 7 days
    const [expensesLast7DaysTotal, profitLast7DaysTotal] = await Promise.all([
      Promise.all(
        last7DaysDates.map((date) =>
          Records.aggregate([
            {
              $match: {
                type: "expense",
                published: true,
                createdAt: {
                  $gte: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                  ),
                  $lt: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate() + 1
                  ),
                },
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $add: [
                      "$cash",
                      "$bank",
                      "$swiper",
                      "$tasdeed",
                      "$serviceFee",
                    ],
                  },
                },
              },
            },
          ]).then((result) => (result.length > 0 ? result[0].total : 0))
        )
      ),
      Promise.all(
        last7DaysDates.map((date) =>
          Records.aggregate([
            {
              $match: {
                type: "expense",
                published: true,
                createdAt: {
                  $gte: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                  ),
                  $lt: new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate() + 1
                  ),
                },
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: "$serviceFee",
                },
              },
            },
          ]).then((result) => (result.length > 0 ? result[0].total : 0))
        )
      ),
    ]);

    // Calculate last 12 months' expenses and incomes
    const last12Months = Array.from({ length: 12 }, (_, index) => {
      let month = currentDate.getMonth() - index;
      let year = currentYear;
      if (month < 0) {
        month += 12;
        year -= 1; // Adjust year for months before January
      }
      return {
        month: month + 1,
        name: new Date(year, month, 1).toLocaleString("en-US", {
          month: "short",
        }),
        year,
      };
    }).reverse();

    const last12MonthsExpenses = Array.from({ length: 12 }, () => 0);
    const last12MonthsProfit = Array.from({ length: 12 }, () => 0);

    const [expensesLast12Months, profitLast12Months] = await Promise.all([
      Promise.all(
        last12Months.map(({ month, year }) =>
          Records.aggregate([
            {
              $match: {
                type: "expense",
                published: true,
                createdAt: {
                  $gte: new Date(year, month - 1, 1),
                  $lt: new Date(year, month, 1),
                },
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $add: [
                      "$cash",
                      "$bank",
                      "$swiper",
                      "$tasdeed",
                      "$serviceFee",
                    ],
                  },
                },
              },
            },
          ]).then((result) => (result.length > 0 ? result[0].total : 0))
        )
      ),
      Promise.all(
        last12Months.map(({ month, year }) =>
          Records.aggregate([
            {
              $match: {
                type: "expense",
                published: true,
                createdAt: {
                  $gte: new Date(year, month - 1, 1),
                  $lt: new Date(year, month, 1),
                },
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: "$serviceFee",
                },
              },
            },
          ]).then((result) => (result.length > 0 ? result[0].total : 0))
        )
      ),
    ]);

    expensesLast12Months.forEach((result, index) => {
      last12MonthsExpenses[index] = result;
    });

    profitLast12Months.forEach((result, index) => {
      last12MonthsProfit[index] = result;
    });

    const monthNames = last12Months.map(({ name }) => name),
      totalIncomeAmount = Number(
        BankIncome + CashIncome + TaseedIncome + SwiperIncome
      ),
      totalExpenseAmount = Number(
        BankExpense + CashExpense + TaseedExpense + SwiperExpense
      ),
      totalBalance = totalIncomeAmount - totalExpenseAmount,
      bankBalance = BankIncome - BankExpense + (SwiperIncome - SwiperExpense),
      cashBalance = CashIncome - CashExpense,
      tasdeedBalance = TaseedIncome - TaseedExpense;

    return Response.json(
      {
        expenseCount,
        incomeCount,
        totalIncomeAmount,
        totalExpenseAmount,
        totalBalance,
        bankBalance,
        cashBalance,
        tasdeedBalance,
        totalProfitAmount,
        daysOfWeekInitials,
        expensesLast7DaysTotal,
        profitLast7DaysTotal,
        last12Months,
        monthNames,
        last12MonthsExpenses,
        last12MonthsProfit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching records:", error);
    return Response.json({ error: "Error fetching records" }, { status: 500 });
  }
}
