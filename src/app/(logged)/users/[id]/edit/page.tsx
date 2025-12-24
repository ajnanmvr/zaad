"use client"
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";
import toast from "react-hot-toast";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AddUser from "@/components/Forms/AddUser";
import UserHistory from "@/components/UserHistory";
import { getUserAction } from "@/actions/users";

interface UserData {
    username: string;
    fullname: string;
    role: string;
}

const EditUserPage = () => {
    const { user } = useUserContext();
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Redirect if user is not a partner
        if (user && user.role !== "partner") {
            router.push("/");
            return;
        }

        // Fetch user data
        const fetchUser = async () => {
            try {
                const data = await getUserAction(userId);
                setUserData(data as any);
            } catch (error: any) {
                const errorMessage = error?.message || "Failed to fetch user";
                toast.error(errorMessage);
                router.push("/users");
            } finally {
                setIsLoading(false);
            }
        };

        if (user && user.role === "partner" && userId) {
            fetchUser();
        }
    }, [user, router, userId]);

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

    if (isLoading) {
        return (
            <DefaultLayout>
                <Breadcrumb pageName="Edit User" />
                <div className="flex justify-center items-center min-h-64">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            </DefaultLayout>
        );
    }

    if (!userData) {
        return (
            <DefaultLayout>
                <Breadcrumb pageName="Edit User" />
                <div className="text-center py-10">
                    <p className="text-red-600 dark:text-red-400">User not found</p>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Edit User" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                    <AddUser
                        editUserId={userId}
                        initialData={userData}
                    />
                </div>
                <div>
                    <UserHistory userId={userId} />
                </div>
            </div>
        </DefaultLayout>
    );
};

export default EditUserPage;