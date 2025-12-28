"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";
import UsersList from "@/components/Tables/UsersList";
import { ShieldCheck } from "lucide-react";

const UsersPage = () => {
    const { user } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        // Redirect if user is not a partner or admin
        if (user && user.role !== "partner" && user.role !== "admin") {
            router.push("/");
        }
    }, [user, router]);

    // Show loading or redirect for non-partners/non-admins
    if (!user || (user.role !== "partner" && user.role !== "admin")) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-boxdark-2">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark backdrop-blur-sm bg-white/80 dark:bg-boxdark/80">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-black dark:text-white">
                                {user?.role === "admin" ? "System Users" : "Portal Users"}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {user?.role === "admin" 
                                    ? "Manage system administrators, partners and employees" 
                                    : "Manage portal users and permissions"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <UsersList />
            </div>
        </div>
    );
};

export default UsersPage;