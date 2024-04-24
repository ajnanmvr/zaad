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

    const year = 2024; // Set the desired year for which you want to calculate monthly data
    const monthlyExpenses = Array.from({ length: 12 }, () => 0);
    const monthlyIncomes = Array.from({ length: 12 }, () => 0);

    // Calculate total expenses of the past 7 days
    const today = new Date();
    const daysOfWeekInitials = [];

    const last7DaysDates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayInitial = date
        .toLocaleString("en-US", { weekday: "short" })[0]
        .toUpperCase();
      daysOfWeekInitials.push(dayInitial);
      last7DaysDates.push(date);
    }

    // Fetch expenses and incomes for the last 7 days
    const [expensesResults, incomesResults] = await Promise.all([
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

    // Calculate monthly expenses and incomes
    const [expenseResults, incomeResults] = await Promise.all([
      Records.aggregate([
        {
          $match: {
            type: "expense",
            createdAt: {
              $gte: new Date(year, 0, 1), // January 1st of the given year
              $lt: new Date(year + 1, 0, 1), // January 1st of the next year
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: {
              $sum: { $add: ["$cash", "$bank", "$swiper", "$tasdeed"] },
            },
          },
        },
      ]),
      Records.aggregate([
        {
          $match: {
            type: "income",
            createdAt: {
              $gte: new Date(year, 0, 1), // January 1st of the given year
              $lt: new Date(year + 1, 0, 1), // January 1st of the next year
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: {
              $sum: { $add: ["$cash", "$bank", "$swiper", "$tasdeed"] },
            },
          },
        },
      ]),
    ]);

    expenseResults.forEach((result) => {
      const monthIndex = result._id - 1;
      monthlyExpenses[monthIndex] = result.total;
    });

    incomeResults.forEach((result) => {
      const monthIndex = result._id - 1;
      monthlyIncomes[monthIndex] = result.total;
    });

    return Response.json(
      {
        expenseCount,
        totalExpenseAmount,
        incomeCount,
        totalIncomeAmount,
        daysOfWeekInitials,
        expensesLast7DaysTotal: expensesResults,
        incomesLast7DaysTotal: incomesResults,
        monthlyExpenses,
        monthlyIncomes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching records:", error);
    return Response.json({ error: "Error fetching records" }, { status: 500 });
  }
}
