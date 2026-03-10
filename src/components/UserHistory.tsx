"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatDateTime } from "@/utils/dateUtils";
import { FiUserCheck, FiEdit3, FiUserX, FiLock, FiShield, FiRefreshCw, FiActivity } from "react-icons/fi";
import clsx from "clsx";

interface UserActivity {
    _id: string;
    action: string;
    createdAt: string;
    performedBy: {
        _id: string;
        username: string;
        fullname: string;
    };
    targetUser: {
        _id: string;
        username: string;
        fullname: string;
    };
    details: Record<string, any>;
    previousValues: Record<string, any>;
    newValues: Record<string, any>;
    ipAddress?: string;
}

interface UserHistoryProps {
    userId: string;
    className?: string;
}

interface ActivityHistoryResponse {
    activities: UserActivity[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalActivities: number;
        hasMore: boolean;
    };
}

const getActionIcon = (action: string) => {
    switch (action) {
        case "create":
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-slate-900">
                    <FiUserCheck className="text-lg" />
                </div>
            );
        case "update":
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-4 ring-white dark:bg-amber-500/20 dark:text-amber-400 dark:ring-slate-900">
                    <FiEdit3 className="text-lg" />
                </div>
            );
        case "delete":
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 ring-4 ring-white dark:bg-rose-500/20 dark:text-rose-400 dark:ring-slate-900">
                    <FiUserX className="text-lg" />
                </div>
            );
        case "password_change":
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-slate-900">
                    <FiLock className="text-lg" />
                </div>
            );
        case "role_change":
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 ring-4 ring-white dark:bg-teal-500/20 dark:text-teal-400 dark:ring-slate-900">
                    <FiShield className="text-lg" />
                </div>
            );
        case "reactivate":
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-slate-900">
                    <FiRefreshCw className="text-lg" />
                </div>
            );
        default:
            return (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-4 ring-white dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-900">
                    <FiActivity className="text-lg" />
                </div>
            );
    }
};

const getActionTitle = (action: string) => {
    switch (action) {
        case "create": return "Account Created";
        case "update": return "Profile Updated";
        case "delete": return "Account Suspended";
        case "password_change": return "Password Reset/Changed";
        case "role_change": return "Privilege Level Modified";
        case "reactivate": return "Account Reactivated";
        default: return "System Activity";
    }
};

const getActionDescription = (activity: UserActivity) => {
    const { action, previousValues, newValues } = activity;

    switch (action) {
        case "create":
            return `Assigned role: ${newValues.role || "employee"}`;
        case "update":
            const changes = [];
            if (previousValues.username && newValues.username) {
                changes.push(`username from "${previousValues.username}" to "${newValues.username}"`);
            }
            if (previousValues.fullname !== undefined && newValues.fullname !== undefined) {
                changes.push(`name from "${previousValues.fullname || 'N/A'}" to "${newValues.fullname || 'N/A'}"`);
            }
            return changes.length > 0 ? `Changed ${changes.join(", ")}` : "User details modified";
        case "delete":
            return "User access revoked (soft deletion)";
        case "password_change":
            return "Security credentials were updated";
        case "role_change":
            return `Role transitioned from "${previousValues.role}" to "${newValues.role}"`;
        case "reactivate":
            return "User access was fully restored";
        default:
            return "Audited system event";
    }
};

export default function UserHistory({ userId, className = "" }: UserHistoryProps) {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        currentPage: 0,
        totalPages: 0,
        totalActivities: 0,
        hasMore: false
    });
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchActivities = useCallback(async (page: number = 0, append: boolean = false) => {
        try {
            if (!append) setLoading(true);
            else setLoadingMore(true);

            const response = await fetch(`/api/users/${userId}/history?page=${page}&limit=10`);

            if (!response.ok) {
                throw new Error("Failed to fetch activity history");
            }

            const data: ActivityHistoryResponse = await response.json();

            if (append) {
                setActivities(prev => [...prev, ...data.activities]);
            } else {
                setActivities(data.activities);
            }

            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [userId]);

    const loadMore = () => {
        if (pagination.hasMore && !loadingMore) {
            fetchActivities(pagination.currentPage + 1, true);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    if (loading) {
        return (
            <div className={clsx("rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50", className)}>
                <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-5 rounded-t-2xl dark:border-slate-800 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiActivity className="text-emerald-500" /> Recent Activity
                    </h3>
                </div>
                <div className="p-6">
                    <div className="animate-pulse space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                <div className="flex flex-1 flex-col gap-2 pt-1.5">
                                    <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={clsx("rounded-2xl border border-rose-200 bg-white shadow-sm ring-1 ring-rose-200/50 dark:border-rose-900/50 dark:bg-slate-900/50", className)}>
                <div className="p-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/20">
                        <FiActivity className="text-xl" />
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Unable to load history</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{error}</p>
                    <button
                        onClick={() => fetchActivities()}
                        className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={clsx("rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50", className)}>
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-5 rounded-t-2xl dark:border-slate-800 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FiActivity className="text-emerald-500" /> Recent Activity
                </h3>
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {pagination.totalActivities} Records
                </span>
            </div>

            <div className="p-6">
                {activities.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <FiActivity className="text-xl text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">No activity recorded</p>
                        <p className="text-sm">There are no history logs for this user yet.</p>
                    </div>
                ) : (
                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent dark:before:via-slate-700">
                        {activities.map((activity) => (
                            <div key={activity._id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group">
                                
                                {/* Timeline Icon */}
                                <div className="flex items-center justify-center w-10 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shrink-0">
                                    {getActionIcon(activity.action)}
                                </div>

                                {/* Content Card */}
                                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-800/50">
                                    <div className="mb-1 flex items-center justify-between">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                                            {getActionTitle(activity.action)}
                                        </h4>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {formatDateTime(activity.createdAt)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                        {getActionDescription(activity)}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                {activity.performedBy.username.substring(0,2)}
                                            </span>
                                            <span>
                                                By <span className="font-semibold text-slate-700 dark:text-slate-300">{activity.performedBy.username}</span>
                                            </span>
                                        </div>
                                        {activity.ipAddress && (
                                            <div className="flex items-center gap-1 opacity-70 border-l border-slate-200 dark:border-slate-700 pl-4">
                                                <span>IP: {activity.ipAddress}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {pagination.hasMore && (
                            <div className="relative z-10 text-center pt-4">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emerald-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700"
                                >
                                    {loadingMore ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <FiActivity /> Load Older ({pagination.totalActivities - activities.length})
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
