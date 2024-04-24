import connect from "@/db/connect";
import Records from "@/models/records";

connect();
export async function GET() {
  try {
    // Get count of expense records and calculate total expenses
    const [expenseCount, totalExpenseAmount] = await Promise.all([
      Records.countDocuments({ type: "expense" }),
      Records.aggregate([
        { $match: { type: "expense" } },
        {
          $group: {
            _id: null,
            total: {
              $sum: { $add: ["$cash", "$bank", "$swiper", "$tasdeed"] },
            },
          },
        },
      ]).then((result) => (result.length > 0 ? result[0].total : 0)),
    ]);

    // Get count of income records and calculate total income
    const [incomeCount, totalIncomeAmount] = await Promise.all([
      Records.countDocuments({ type: "income" }),
      Records.aggregate([
        { $match: { type: "income" } },
        {
          $group: {
            _id: null,
            total: {
              $sum: { $add: ["$cash", "$bank", "$swiper", "$tasdeed"] },
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
    const [expensesLast7DaysTotal, incomesLast7DaysTotal] = await Promise.all([
      Promise.all(
        last7DaysDates.map((date) =>
          Records.aggregate([
            {
              $match: {
                type: "expense",
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
                  $sum: { $add: ["$cash", "$bank", "$swiper", "$tasdeed"] },
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
                type: "income",
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
                  $sum: { $add: ["$cash", "$bank", "$swiper", "$tasdeed"] },
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

    const monthlyExpenses = Array.from({ length: 12 }, () => 0);
    const monthlyIncomes = Array.from({ length: 12 }, () => 0);

    const [expensesLast12Months, incomesLast12Months] = await Promise.all([
      Promise.all(
        last12Months.map(({ month, year }) =>
          Records.aggregate([
            {
              $match: {
                type: "expense",
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
                  $sum: { $add: ["$cash", "$bank", "$swiper", "$tasdeed"] },
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
                type: "income",
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
                  $sum: { $add: ["$cash", "$bank", "$swiper", "$tasdeed"] },
                },
              },
            },
          ]).then((result) => (result.length > 0 ? result[0].total : 0))
        )
      ),
    ]);

    expensesLast12Months.forEach((result, index) => {
      monthlyExpenses[index] = result;
    });

    incomesLast12Months.forEach((result, index) => {
      monthlyIncomes[index] = result;
    });

    const monthNames = last12Months.map(({ name }) => name);

    return Response.json(
      {
        expenseCount,
        totalExpenseAmount,
        incomeCount,
        totalIncomeAmount,
        daysOfWeekInitials,
        expensesLast7DaysTotal,
        incomesLast7DaysTotal,
        last12Months,
        monthNames,
        last12MonthsExpenses: monthlyExpenses,
        last12MonthsIncomes: monthlyIncomes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching records:", error);
    return Response.json({ error: "Error fetching records" }, { status: 500 });
  }
}
