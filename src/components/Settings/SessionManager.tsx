"use client";

import { useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiMonitor, FiTrash2, FiLogOut } from "react-icons/fi";

type UserSessionItem = {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  isCurrent: boolean;
};

type SessionsResponse = {
  sessions: UserSessionItem[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "---";
  }
  return date.toLocaleString();
}

const SessionManager = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SessionsResponse>({
    queryKey: ["user-sessions"],
    queryFn: async () => {
      const response = await axios.get("/api/users/auth/sessions");
      return response.data;
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await axios.delete(`/api/users/auth/sessions/${sessionId}`);
      return response.data as { success?: boolean; message?: string };
    },
    onSuccess: (_data, sessionId) => {
      const revokedSession = sessions.find((session) => session.id === sessionId);
      if (revokedSession?.isCurrent) {
        window.location.href = "/login";
        return;
      }

      toast.success("Session revoked");
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    },
    onError: () => {
      toast.error("Failed to revoke session");
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      await axios.post("/api/users/auth/logout-all");
    },
    onSuccess: () => {
      toast.success("Logged out from all sessions");
      window.location.href = "/login";
    },
    onError: () => {
      toast.error("Failed to logout all sessions");
    },
  });

  const sessions = useMemo(() => data?.sessions || [], [data]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">
            Active Sessions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your active devices and revoke suspicious sessions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => logoutAllMutation.mutate()}
          disabled={logoutAllMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        >
          <FiLogOut />
          Logout All
        </button>
      </div>

      <div className="p-6 sm:p-8">
        {isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No active sessions found.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <FiMonitor />
                      {session.userAgent || "Unknown device"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      IP: {session.ipAddress || "Unknown"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Started: {formatDate(session.createdAt)} | Expires: {formatDate(session.expiresAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.isCurrent && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                        Current
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => revokeSessionMutation.mutate(session.id)}
                      disabled={revokeSessionMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <FiTrash2 />
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManager;
