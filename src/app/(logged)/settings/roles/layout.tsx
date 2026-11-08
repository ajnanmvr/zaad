"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUserContext } from "@/contexts/UserContext";
import { isDeveloperRole } from "@/auth/roleConstants";

// Roles & permissions administration (list, create, edit) is visible to the developer only.
export default function RolesLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUserContext();
  const router = useRouter();
  const allowed = isDeveloperRole(user?.role);

  useEffect(() => {
    if (user && !allowed) router.replace("/not-permitted");
  }, [user, allowed, router]);

  if (!user || !allowed) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
