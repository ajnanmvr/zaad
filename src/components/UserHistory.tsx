"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatDateTime } from "@/utils/dateUtils";

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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <svg className="h-4 w-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
            );
        case "update":
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
                    <svg className="h-4 w-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </div>
            );
        case "delete":
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/10">
                    <svg className="h-4 w-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
            );
        case "password_change":
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                    </svg>
                </div>
            );
        case "role_change":
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-meta-6/10">
                    <svg className="h-4 w-4 text-meta-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
            );
        case "reactivate":
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <svg className="h-4 w-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
        default:
            return (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-2 dark:bg-meta-4">
                    <svg className="h-4 w-4 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );
    }
};

const getActionTitle = (action: string) => {
    switch (action) {
        case "create": return "User Created";
        case "update": return "User Updated";
        case "delete": return "User Deleted";
        case "password_change": return "Password Changed";
        case "role_change": return "Role Changed";
        case "reactivate": return "User Reactivated";
        default: return "Activity";
    }
};

const getActionDescription = (activity: UserActivity) => {
    const { action, previousValues = {}, newValues = {} } = activity;

    switch (action) {
        case "create":
            return `User created with role: ${newValues?.role || "employee"}`;
        case "update":
            const changes = [];
            if (previousValues?.username && newValues?.username) {
                changes.push(`username from "${previousValues.username}" to "${newValues.username}"`);
            }
            if (previousValues?.fullname !== undefined && newValues?.fullname !== undefined) {
                changes.push(`full name from "${previousValues.fullname || 'N/A'}" to "${newValues.fullname || 'N/A'}"`);
            }
            return changes.length > 0 ? `Changed ${changes.join(", ")}` : "User information updated";
        case "delete":
            return "User was soft deleted (unpublished)";
        case "password_change":
            return "User password was changed";
        case "role_change":
            return `Role changed from "${previousValues?.role || 'N/A'}" to "${newValues?.role || 'N/A'}"`;
        case "reactivate":
            return "User was restored from deleted state";
        default:
            return "Activity performed";
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
            <div className={`rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${className}`}>
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Activity History
                    </h3>
                </div>
                <div className="p-6.5">
                    <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <div className="h-8 w-8 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
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
            <div className={`rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${className}`}>
                <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Activity History
                    </h3>
                </div>
                <div className="p-6.5">
                    <div className="text-center text-red-500">
                        <p>Error loading activity history: {error}</p>
                        <button
                            onClick={() => fetchActivities()}
                            className="mt-2 text-primary hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark ${className}`}>
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    Activity History ({pagination.totalActivities} total)
                </h3>
            </div>

            <div className="p-6.5">
                {activities.length === 0 ? (
                    <div className="text-center text-body-color py-8">
                        <p>No activity history found for this user.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity, index) => (
                            <div key={activity._id} className="flex items-start space-x-4 pb-4 border-b border-stroke last:border-b-0 dark:border-strokedark">
                                {getActionIcon(activity.action)}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <h4 className="font-medium text-black dark:text-white text-sm">
                                            {getActionTitle(activity.action)}
                                        </h4>
                                        <span className="text-xs text-body-color">
                                            {formatDateTime(activity.createdAt)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-body-color mt-1">
                                        {getActionDescription(activity)}
                                    </p>

                                    <div className="flex items-center text-xs text-body-color mt-2 space-x-4">
                                        <span>
                                            Performed by: <span className="font-medium">{activity.performedBy.username}</span>
                                            {activity.performedBy.fullname && (
                                                <span> ({activity.performedBy.fullname})</span>
                                            )}
                                        </span>
                                        {activity.ipAddress && (
                                            <span>IP: {activity.ipAddress}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {pagination.hasMore && (
                            <div className="text-center pt-4">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loadingMore ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Loading more...
                                        </>
                                    ) : (
                                        `Load more (${pagination.totalActivities - activities.length} remaining)`
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