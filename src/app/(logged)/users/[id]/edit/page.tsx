"use client";

import { getUserAction } from "@/actions/users";
import AddUser from "@/components/Forms/AddUser";
import UserHistory from "@/components/UserHistory";
import { useUserContext } from "@/contexts/UserContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="space-y-4 p-4 md:p-6">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Users</p>
                    <h1 className="text-2xl font-semibold text-black dark:text-white">Edit User</h1>
                </div>
                <div className="rounded-2xl border border-gray-200/60 bg-white p-6 text-center text-red-600 shadow-sm dark:border-gray-800 dark:bg-boxdark dark:text-red-400">
                    User not found
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Users</p>
                <h1 className="text-2xl font-semibold text-black dark:text-white">Edit User</h1>
                <p className="text-gray-600 dark:text-gray-400">Update account details and review activity.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-boxdark md:p-6">
                    <AddUser editUserId={userId} initialData={userData} />
                </div>
                <div className="rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-boxdark md:p-6">
                    <UserHistory userId={userId} />
                </div>
            </div>
        </div>
    );
};

export default EditUserPage;