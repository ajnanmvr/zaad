// User Activity Types
export interface UserActivity {
    _id: string;
    action: "create" | "update" | "delete" | "password_change" | "role_change";
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
    userAgent?: string;
}

export interface ActivityHistoryResponse {
    activities: UserActivity[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalActivities: number;
        hasMore: boolean;
    };
}