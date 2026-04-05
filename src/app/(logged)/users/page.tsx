"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import UsersList from "@/components/Tables/UsersList";

const UsersPage = () => {
    const { user } = useUserContext();
    const router = useRouter();
    const canReadUsers = Array.isArray(user?.permissions) && user.permissions.includes("users.read");

    useEffect(() => {
        if (user && !canReadUsers) {
            router.push("/");
        }
    }, [user, canReadUsers, router]);

    if (!user || !canReadUsers) {
        return (
            <>
                <div className="flex justify-center items-center min-h-64">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            </>
        );
    }

    return (
        <>
            <Breadcrumb pageName="System Users" />
            <div className="flex flex-col gap-6">
                <UsersList />
            </div>
        </>
    );
};

export default UsersPage;
