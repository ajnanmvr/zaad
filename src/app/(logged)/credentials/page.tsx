"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import EntityAvatar from "@/components/common/EntityAvatar";
import { FiChevronRight, FiKey, FiSearch } from "react-icons/fi";

type CredentialRow = {
  id: string;
  entityId: string;
  entityName: string;
  entityType: string;
  entityColor?: string;
  platform: string;
  username?: string;
  notes?: string;
  credential?: string;
};

type CredentialsResponse = {
  success: boolean;
  summary: CredentialRow[];
};

export default function CredentialsPage() {
  const [platform, setPlatform] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setPlatform(String(searchParams.get("platform") || "").trim());
    setSearch(String(searchParams.get("search") || "").trim());
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (search) params.set("search", search);
    return params.toString();
  }, [platform, search]);

  const { data, isLoading, isError } = useQuery<CredentialsResponse>({
    queryKey: ["credentials-list", platform, search],
    queryFn: async () => {
      const { data } = await axios.get(`/api/credentials${queryString ? `?${queryString}` : ""}`);
      return data;
    },
  });

  const rows = data?.summary || [];

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Credentials" />

      <section className="rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm dark:border-cyan-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/20 dark:text-cyan-300">
              <FiKey /> Credential Registry
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">All Credentials</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Browse credentials across entities and filter by platform.
            </p>
          </div>
          {platform ? (
            <div className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-semibold text-cyan-700 dark:border-cyan-800/40 dark:bg-slate-900 dark:text-cyan-300">
              Platform: {platform}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
          <FiSearch className="text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Use the settings page to open this list filtered by platform.
          </span>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
            Loading credentials...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-10 text-center text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/20 dark:text-rose-300">
            Failed to load credentials.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
            No credentials found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const entityHref = `/${row.entityType}/${row.entityId}/credentials`;
                  return (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <EntityAvatar name={row.entityName} color={row.entityColor} size="sm" />
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{row.entityName}</p>
                            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">{row.entityType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{row.platform || "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{row.username || "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{row.notes || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={entityHref}
                          className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 hover:bg-cyan-100 dark:border-cyan-700/40 dark:bg-cyan-900/20 dark:text-cyan-300"
                        >
                          View Entity <FiChevronRight />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
