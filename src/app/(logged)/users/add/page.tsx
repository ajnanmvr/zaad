"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AddUser from "@/components/Forms/AddUser";

const AddUserPage = () => {
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
            <Breadcrumb pageName="Add User" />
            <div className="flex flex-col gap-10">
                <AddUser />
            </div>
        </DefaultLayout>
    );
};

export default AddUserPage;