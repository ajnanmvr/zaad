"use client"
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";
import axios from "axios";
import toast from "react-hot-toast";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AddUser from "@/components/Forms/AddUser";
import UserHistory from "@/components/UserHistory";

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
    const canReadUsers = Array.isArray(user?.permissions) && user.permissions.includes("users.read");

    useEffect(() => {
        if (user && !canReadUsers) {
            router.push("/");
            return;
        }

        // Fetch user data
        const fetchUser = async () => {
            try {
                const { data } = await axios.get(`/api/users/${userId}`);
                setUserData(data.user);
            } catch (error: any) {
                const errorMessage = error.response?.data?.error || "Failed to fetch user";
                toast.error(errorMessage);
                router.push("/users");
            } finally {
                setIsLoading(false);
            }
        };

        if (user && canReadUsers && userId) {
            fetchUser();
        }
    }, [user, canReadUsers, router, userId]);

    if (!user || !canReadUsers) {
        return (
            <>
                <div className="flex justify-center items-center min-h-64">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            </>
        );
    }

    if (isLoading) {
        return (
            <>
                <Breadcrumb pageName="Edit User" />
                <div className="flex justify-center items-center min-h-64">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            </>
        );
    }

    if (!userData) {
        return (
            <>
                <Breadcrumb pageName="Edit User" />
                <div className="text-center py-10">
                    <p className="text-red-600 dark:text-red-400">User not found</p>
                </div>
            </>
        );
    }

    return (
        <>
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
        </>
    );
};

export default EditUserPage;