import React from 'react';

const ReportPage = ({ profitsData, accountsData }: { profitsData: any, accountsData: any }) => {
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
              {/* Total Transactions */}
              <td className="px-4 py-2 whitespace-nowrap">Total Transactions</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.expenseCount + accountsData.incomeCount}</td>
            </tr>
            {/* Profit Information Section */}
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Total Profit</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.profit.toFixed(2)} AED</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Received Profit</td>
              <td className="px-4 py-2 whitespace-nowrap">{profitsData.profit.toFixed(2)} AED</td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-4 py-2 whitespace-nowrap">Credit Profit</td>
              <td className="px-4 py-2 whitespace-nowrap">{(accountsData.profit - profitsData.profit).toFixed(2)} AED</td>
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
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Income (AED)</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Expense (AED)</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Balance (AED)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              {/* Cash Income */}
              <td className="px-4 py-2 whitespace-nowrap">Cash Income</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.CashIncome.toFixed(2)}</td>

              {/* Cash Expense */}
              <td className="px-4 py-2 whitespace-nowrap">Cash Expense</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.CashExpense.toFixed(2)}</td>

              {/* Cash Balance */}
              <td className="px-4 py-2 whitespace-nowrap">Cash Balance</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.cashBalance.toFixed(2)}</td>

            </tr>
            <tr className="border-b border-gray-300">
              {/* Bank Income */}
              <td className="px-4 py-2 whitespace-nowrap">Bank Income</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.BankIncome.toFixed(2)}</td>

              {/* Bank Expense */}
              <td className="px-4 py-2 whitespace-nowrap">Bank Expense</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.BankExpense.toFixed(2)}</td>

              {/* Bank Balance */}
              <td className="px-4 py-2 whitespace-nowrap">Bank Balance</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.bankBalance.toFixed(2)}</td>

            </tr>
            <tr className="border-b border-gray-300">
              {/* Tasdeed Income */}
              <td className="px-4 py-2 whitespace-nowrap">Tasdeed Income</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.TasdeedIncome.toFixed(2)}</td>

              {/* Tasdeed Expense */}
              <td className="px-4 py-2 whitespace-nowrap">Tasdeed Expense</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.TasdeedExpense.toFixed(2)}</td>

              {/* Tasdeed Balance */}
              <td className="px-4 py-2 whitespace-nowrap">Tasdeed Balance</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.tasdeedBalance.toFixed(2)}</td>

            </tr>
            <tr className="border-b border-gray-300">
              {/* Swiper Income */}
              <td className="px-4 py-2 whitespace-nowrap">Swiper Income</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.SwiperIncome.toFixed(2)}</td>

              {/* Swiper Expense */}
              <td className="px-4 py-2 whitespace-nowrap">Swiper Expense</td>
              <td className="px-4 py-2 whitespace-nowrap">{accountsData.SwiperExpense.toFixed(2)}</td>

              {/* Total Balance */}
              <td className="px-4 font-bold bg-black text-white py-2 whitespace-nowrap">Total Balance</td>
              <td className="px-4 font-bold bg-black text-white py-2 whitespace-nowrap">{accountsData.totalBalance.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>


    </div>
  );
}

export default ReportPage;
