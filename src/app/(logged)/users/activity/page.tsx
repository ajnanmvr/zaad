"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { useUserContext } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";

const actions = [
  "",
  "login",
  "logout",
  "logout_all",
  "token_refresh",
  "session_revoke",
  "auth_denied",
  "password_change",
  "role_change",
  "create",
  "update",
  "delete",
  "reactivate",
];

const ActivityAuditPage = () => {
  const { user } = useUserContext();
  const router = useRouter();
  const [action, setAction] = useState("");
  const [page, setPage] = useState(0);

  const canReadAudit =
    Array.isArray(user?.permissions) && user.permissions.includes("users.activity.read");

  if (user && !canReadAudit) {
    router.push("/not-permitted");
  }

  const query = useQuery({
    queryKey: ["activity-audit", page, action],
    queryFn: async () => {
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (action) {
        query.set("action", action);
      }
      const { data } = await axios.get(`/api/users/activity?${query.toString()}`);
      return data;
    },
    enabled: canReadAudit,
  });

  const rows = useMemo(() => query.data?.activities || [], [query.data]);
  const pagination = query.data?.pagination;

  if (!user || !canReadAudit) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Security Audit" />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-4 flex items-center justify-between gap-4">
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {actions.map((item) => (
              <option key={item || "all"} value={item}>
                {item || "all actions"}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Performed By</th>
                <th className="px-3 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row._id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2 font-medium">{row.action}</td>
                  <td className="px-3 py-2">{row.targetUser?.username || "---"}</td>
                  <td className="px-3 py-2">{row.performedBy?.username || "---"}</td>
                  <td className="px-3 py-2">{new Date(row.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span>
            Page {(pagination?.currentPage || 0) + 1} of {pagination?.totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50 dark:border-slate-700"
              disabled={!pagination || pagination.currentPage <= 0}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            >
              Previous
            </button>
            <button
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50 dark:border-slate-700"
              disabled={!pagination || !pagination.hasMore}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityAuditPage;
