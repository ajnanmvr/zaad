"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";
import UsersList from "@/components/Tables/UsersList";

const UsersPage = () => {
    const { user } = useUserContext();
    const router = useRouter();

    useEffect(() => {
        // Redirect if user is not a partner
        if (user && user.role !== "partner") {
            router.push("/");
        }
    }, [user, router]);

    // Show loading or redirect for non-partners
    if (!user || user.role !== "partner") {
        return <div className="flex h-screen items-center justify-center"><div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent"></div></div>;
    }

    return <UsersList />;
};

export default UsersPage;