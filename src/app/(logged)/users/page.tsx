"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
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
        return (
            <DefaultLayout>
                <div className="flex justify-center items-center min-h-64">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Users" />
            <div className="flex flex-col gap-10">
                <UsersList />
            </div>
        </DefaultLayout>
    );
};

export default UsersPage;