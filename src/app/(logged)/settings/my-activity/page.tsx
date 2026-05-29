"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiClock } from "react-icons/fi";

type ActivityItem = {
  _id: string;
  action: string;
  targetUser?: { username?: string };
  performedBy?: { username?: string };
  createdAt: string;
};

type ActivityResponse = {
  activities: ActivityItem[];
};

const formatAction = (action: string) => action.replace(/_/g, " ");

export default function MyActivityPage() {
  const { user, isUserLoading } = useUserContext();
  const router = useRouter();
  const canViewAudit =
    Array.isArray(user?.permissions) && user.permissions.includes("users.activity.read");

  useEffect(() => {
    if (!isUserLoading && user && !canViewAudit) {
      router.replace("/not-permitted");
    }
  }, [isUserLoading, user, canViewAudit, router]);

  const activitiesQuery = useQuery({
    queryKey: ["my-activity", user?._id],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/users/activity?userId=${encodeURIComponent(user?._id || "")}&limit=50`,
      );
      return data as ActivityResponse;
    },
    enabled: Boolean(user?._id) && canViewAudit,
  });

  const activities = useMemo(
    () => activitiesQuery.data?.activities || [],
    [activitiesQuery.data?.activities],
  );

  if (isUserLoading || (!canViewAudit && user)) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <Breadcrumb pageName="My Activity" />
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm text-slate-500">Loading access...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName="My Activity" />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        {activitiesQuery.isLoading ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading activity...
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-slate-500">No activity found for your account.</p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60"
              >
                <div>
                  <p className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {formatAction(activity.action)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Target: {activity.targetUser?.username || "n/a"} | Actor: {activity.performedBy?.username || "n/a"}
                  </p>
                </div>
                <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <FiClock />
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
