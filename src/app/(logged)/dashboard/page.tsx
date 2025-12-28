"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download
} from "lucide-react";
import { getAccountsSummaryAction, getProfitsSummaryAction } from "@/actions/payment";
import { TAccountsData, TProfitsData } from "@/types/dashboard";
import { StatsCard } from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const getCurrentMonthData = () => {
  const now = new Date();
  return {
    m: "current",
    y: now.getFullYear().toString(),
  };
};

const baseData = getCurrentMonthData();

export default function ModernDashboard() {
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [filterDummy, setFilterDummy] = useState({ ...baseData });
  const [filter, setFilter] = useState({ ...baseData });

  const { data: accountsData, isLoading: accountsLoading } = useQuery<TAccountsData>({
    queryKey: ["accounts", filter.m, filter.y],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (filter.m) params.m = filter.m;
      if (filter.y) params.y = filter.y;
      return await getAccountsSummaryAction(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const { data: profitsData, isLoading: profitsLoading } = useQuery<TProfitsData>({
    queryKey: ["profits", filter.m, filter.y],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (filter.m) params.m = filter.m;
      if (filter.y) params.y = filter.y;
      return await getProfitsSummaryAction(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const isLoading = accountsLoading || profitsLoading;

  const handleFilter = () => {
    setFilter(filterDummy);
    setFilterOpen(false);
  };

  const handleCurrentFilter = () => {
    setFilter({ m: "current", y: "" });
    setFilterDummy({ m: "current", y: "" });
    setFilterOpen(false);
  };

  const handleAllFilter = () => {
    setFilter({ m: "", y: "" });
    setFilterDummy({ m: "", y: "" });
    setFilterOpen(false);
  };

  const getFilterLabel = () => {
    if (filter.m === "current") {
      const now = new Date();
      const monthName = now.toLocaleString('default', { month: 'long' });
      return monthName;
    }
    if (filter.m && filter.y) {
      const monthNum = parseInt(filter.m);
      const monthName = new Date(parseInt(filter.y), monthNum - 1).toLocaleString('default', { month: 'long' });
      return `${monthName} / ${filter.y}`;
    }
    if (filter.m) {
      const monthNum = parseInt(filter.m);
      const monthName = new Date(new Date().getFullYear(), monthNum - 1).toLocaleString('default', { month: 'long' });
      return monthName;
    }
    if (filter.y) return filter.y;
    return "All Time";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Financial overview and analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Download className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setFilterOpen(true)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {getFilterLabel()}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Primary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Transactions"
            value={(accountsData?.expenseCount ?? 0) + (accountsData?.incomeCount ?? 0)}
            icon={<FileText className="h-6 w-6" />}
            loading={isLoading}
          />
          <StatsCard
            title="Net Profit"
            value={`${(accountsData?.netProfit ?? 0).toFixed(2)} AED`}
            icon={<TrendingUp className="h-6 w-6" />}
            loading={isLoading}
            variant="success"
          />
          <StatsCard
            title="Total Credit"
            value={`${((profitsData?.totalToGet ?? 0) * -1).toFixed(2)} AED`}
            icon={<ArrowDownRight className="h-6 w-6" />}
            loading={isLoading}
            variant="info"
          />
          <StatsCard
            title="Total Debit"
            value={`${(profitsData?.totalToGive ?? 0).toFixed(2)} AED`}
            icon={<ArrowUpRight className="h-6 w-6" />}
            loading={isLoading}
            variant="danger"
          />
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Balance"
            value={`${(accountsData?.totalBalance ?? 0).toFixed(2)} AED`}
            icon={<Wallet className="h-6 w-6" />}
            loading={isLoading}
          />
          <StatsCard
            title="Cash Balance"
            value={`${(accountsData?.cashBalance ?? 0).toFixed(2)} AED`}
            icon={<DollarSign className="h-6 w-6" />}
            loading={isLoading}
            variant="success"
          />
          <StatsCard
            title="Bank Balance"
            value={`${(accountsData?.bankBalance ?? 0).toFixed(2)} AED`}
            icon={<Building2 className="h-6 w-6" />}
            loading={isLoading}
            variant="info"
          />
          <StatsCard
            title="Tasdeed Balance"
            value={`${(accountsData?.tasdeedBalance ?? 0).toFixed(2)} AED`}
            icon={<Wallet className="h-6 w-6" />}
            loading={isLoading}
            variant="warning"
          />
        </div>

        {/* Company & Employee Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Companies Credit"
            value={`${((profitsData?.totalToGetCompanies ?? 0) * -1).toFixed(2)} AED`}
            icon={<Building2 className="h-6 w-6" />}
            loading={isLoading}
            variant="success"
          />
          <StatsCard
            title="Companies Debit"
            value={`${(profitsData?.totalToGiveCompanies ?? 0).toFixed(2)} AED`}
            icon={<Building2 className="h-6 w-6" />}
            loading={isLoading}
            variant="danger"
          />
          <StatsCard
            title="Individual Credit"
            value={`${((profitsData?.totalToGetEmployees ?? 0) * -1).toFixed(2)} AED`}
            icon={<Users className="h-6 w-6" />}
            loading={isLoading}
            variant="success"
          />
          <StatsCard
            title="Individual Debit"
            value={`${(profitsData?.totalToGiveEmployees ?? 0).toFixed(2)} AED`}
            icon={<Users className="h-6 w-6" />}
            loading={isLoading}
            variant="danger"
          />
        </div>

        {/* Debit/Credit Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Companies Debit */}
          {profitsData?.over0balanceCompanies && profitsData.over0balanceCompanies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Company Debit List
                  <Badge variant="danger" className="ml-auto">
                    {profitsData.over0balanceCompanies.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profitsData.over0balanceCompanies.slice(0, 5).map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-medium text-sm capitalize">
                      {company.name}
                    </span>
                    <span className="text-sm font-semibold text-red">
                      {company.balance.toFixed(2)} AED
                    </span>
                  </div>
                ))}
                {profitsData.over0balanceCompanies.length > 5 && (
                  <Link
                    href={`/dashboard/liabilities?type=company-debit`}
                    className="mt-4 w-full py-2 px-4 text-center text-sm font-semibold text-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    View All ({profitsData.over0balanceCompanies.length})
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Companies Credit */}
          {profitsData?.under0balanceCompanies && profitsData.under0balanceCompanies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Company Credit List
                  <Badge variant="success" className="ml-auto">
                    {profitsData.under0balanceCompanies.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profitsData.under0balanceCompanies.slice(0, 5).map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-medium text-sm capitalize">
                      {company.name}
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {(company.balance * -1).toFixed(2)} AED
                    </span>
                  </div>
                ))}
                {profitsData.under0balanceCompanies.length > 5 && (
                  <Link
                    href={`/dashboard/liabilities?type=company-credit`}
                    className="mt-4 w-full py-2 px-4 text-center text-sm font-semibold text-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    View All ({profitsData.under0balanceCompanies.length})
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Individual Debit */}
          {profitsData?.over0balanceEmployees && profitsData.over0balanceEmployees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Individual Debit List
                  <Badge variant="danger" className="ml-auto">
                    {profitsData.over0balanceEmployees.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profitsData.over0balanceEmployees.slice(0, 5).map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-medium text-sm capitalize">
                      {employee.name}
                    </span>
                    <span className="text-sm font-semibold text-red">
                      {employee.balance.toFixed(2)} AED
                    </span>
                  </div>
                ))}
                {profitsData.over0balanceEmployees.length > 5 && (
                  <Link
                    href={`/dashboard/liabilities?type=employee-debit`}
                    className="mt-4 w-full py-2 px-4 text-center text-sm font-semibold text-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    View All ({profitsData.over0balanceEmployees.length})
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Individual Credit */}
          {profitsData?.under0balanceEmployees && profitsData.under0balanceEmployees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Individual Credit List
                  <Badge variant="success" className="ml-auto">
                    {profitsData.under0balanceEmployees.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profitsData.under0balanceEmployees.slice(0, 5).map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-medium text-sm capitalize">
                      {employee.name}
                    </span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {(employee.balance * -1).toFixed(2)} AED
                    </span>
                  </div>
                ))}
                {profitsData.under0balanceEmployees.length > 5 && (
                  <Link
                    href={`/dashboard/liabilities?type=employee-credit`}
                    className="mt-4 w-full py-2 px-4 text-center text-sm font-semibold text-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    View All ({profitsData.under0balanceEmployees.length})
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md m-4 animate-scale-in">
            <CardHeader>
              <CardTitle>Filter Analytics Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Month</label>
                  <select
                    value={filterDummy.m}
                    onChange={(e) => setFilterDummy({ ...filterDummy, m: e.target.value })}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition dark:bg-boxdark dark:border-strokedark"
                  >
                    <option value="">None</option>
                    <option value="current">This Month</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2024, i).toLocaleString('default', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year</label>
                  <input
                    type="text"
                    placeholder="Enter Year"
                    value={filterDummy.y}
                    onChange={(e) => setFilterDummy({ ...filterDummy, y: e.target.value })}
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition dark:bg-boxdark dark:border-strokedark"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stroke dark:border-strokedark">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCurrentFilter}>
                    This Month
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleAllFilter}>
                    All Time
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setFilterOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleFilter}>
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
