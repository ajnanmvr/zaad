const toTitleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const ReportPage = ({ profitsData, accountsData }: { profitsData: any, accountsData: any }) => {
  const dynamicRows = (() => {
    if (Array.isArray(accountsData?.methodBreakdown) && accountsData.methodBreakdown.length > 0) {
      return accountsData.methodBreakdown.map((row: any) => ({
        method: toTitleCase(row.method),
        income: Number(row.income || 0),
        expense: Number(row.expense || 0),
        balance: Number(row.balance || 0),
      }));
    }

    const incomeSummary = accountsData?.summary?.income || {};
    const expenseSummary = accountsData?.summary?.expense || {};
    const methods = Array.from(
      new Set([...Object.keys(incomeSummary), ...Object.keys(expenseSummary)])
    ).sort((a, b) => a.localeCompare(b));

    return methods.map((method) => {
      const income = Number(incomeSummary[method] || 0);
      const expense = Number(expenseSummary[method] || 0);
      return {
        method: toTitleCase(method),
        income,
        expense,
        balance: income - expense,
      };
    });
  })();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">General Information</h2>
        <table className="w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Total Transactions</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.expenseCount + accountsData.incomeCount}</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Net Profit</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.netProfit.toFixed(2)} AED</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Total Profit</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.profit.toFixed(2)} AED</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Office Expense</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.zaadExpenseTotal.toFixed(2)} AED</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Profit This Month</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.last12MonthsProfit[11].toFixed(2)} AED</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Today Profit</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.profitLast7DaysTotal[6].toFixed(2)} AED</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Total Credit</td>
              <td className="px-4 py-2 whitespace-nowrap">{((profitsData.totalToGetEmployees + profitsData.totalToGetCompanies) * -1).toFixed(2)} AED</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Total Debit</td>
              <td className="px-4 py-2 whitespace-nowrap">{(profitsData.totalToGiveEmployees + profitsData.totalToGiveCompanies).toFixed(2)} AED</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Income, Expense, and Balance</h2>
        <table className="w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-4 py-2 text-left">Method</th>
              <th className="px-4 py-2 text-left">Income (AED)</th>
              <th className="px-4 py-2 text-left">Expense (AED)</th>
              <th className="px-4 py-2 text-left">Balance (AED)</th>
            </tr>
          </thead>
          <tbody>
            {dynamicRows.map((row: any) => (
              <tr key={row.method} className="border-b border-gray-300">
                <td className="px-4 py-2 whitespace-nowrap">{row.method}</td>
                <td className="px-4 py-2 whitespace-nowrap">{row.income.toFixed(2)}</td>
                <td className="px-4 py-2 whitespace-nowrap">{row.expense.toFixed(2)}</td>
                <td className="px-4 py-2 whitespace-nowrap">{row.balance.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="border-b border-gray-300">
              <td className="px-4 font-bold bg-black text-white py-2 whitespace-nowrap" colSpan={3}>Total Balance</td>
              <td className="px-4 font-bold bg-black text-white py-2 whitespace-nowrap">{accountsData.totalBalance.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>


    </div>
  );
}

export default ReportPage;
