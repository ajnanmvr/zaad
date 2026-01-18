import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { UserRole, checkPermission, type RolePermissions } from "@/types/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: {
    resource: keyof RolePermissions;
    action: "create" | "read" | "update" | "delete";
  };
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role || user.roleIds?.[0];
    if (!userRole || !roles.includes(userRole as UserRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission requirement
  if (requiredPermission) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (user as any).role || user.roleIds?.[0];
    const hasPermission = checkPermission(
      userRole as UserRole,
      requiredPermission.resource,
      requiredPermission.action
    );
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
