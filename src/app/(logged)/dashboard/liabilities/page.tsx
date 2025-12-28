"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getProfitsSummaryAction } from "@/actions/payment";
import { TProfitsData } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LiabilitiesFullPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "company-debit";

  const { data: profitsData, isLoading } = useQuery<TProfitsData>({
    queryKey: ["profits-full", type],
    queryFn: async () => {
      return await getProfitsSummaryAction({});
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const getTitle = () => {
    switch (type) {
      case "company-debit":
        return "Company Debit List";
      case "company-credit":
        return "Company Credit List";
      case "employee-debit":
        return "Individual Debit List";
      case "employee-credit":
        return "Individual Credit List";
      default:
        return "Liabilities";
    }
  };

  const getIcon = () => {
    return type.includes("company") ? (
      <Building2 className="h-6 w-6" />
    ) : (
      <Users className="h-6 w-6" />
    );
  };

  const getData = () => {
    switch (type) {
      case "company-debit":
        return profitsData?.over0balanceCompanies || [];
      case "company-credit":
        return profitsData?.under0balanceCompanies || [];
      case "employee-debit":
        return profitsData?.over0balanceEmployees || [];
      case "employee-credit":
        return profitsData?.under0balanceEmployees || [];
      default:
        return [];
    }
  };

  const isCredit = type.includes("credit");
  const items = getData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                {getIcon()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white">
                  {getTitle()}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total items: {items.length}
                </p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No items found for this category
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-black dark:text-white capitalize">
                        {item.name}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        isCredit ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {isCredit
                        ? `${(item.balance * -1).toFixed(2)} AED`
                        : `${item.balance.toFixed(2)} AED`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
