"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";
import axios from "axios";
import toast from "react-hot-toast";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AddUser from "@/components/Forms/AddUser";
import UserHistory from "@/components/UserHistory";
import { useQuery } from "@tanstack/react-query";

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

  const canReadUsers =
    Array.isArray(user?.permissions) && user.permissions.includes("users.read");
  const canUpdateUsers =
    Array.isArray(user?.permissions) &&
    user.permissions.includes("users.update");

  useEffect(() => {
    if (user && (!canReadUsers || !canUpdateUsers)) {
      router.push("/not-permitted");
    }
  }, [user, canReadUsers, canUpdateUsers, router]);

  const { data: userData, isLoading, isError, error } = useQuery<UserData>({
    queryKey: ["user-edit", userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/users/${userId}`);
      return data.user as UserData;
    },
    enabled: Boolean(user && canReadUsers && canUpdateUsers && userId),
    retry: false,
  });

  useEffect(() => {
    if (!isError) return;
    const typedError = error as any;
    const errorMessage = typedError?.response?.data?.error || "Failed to fetch user";
    toast.error(errorMessage);
    router.push("/users");
  }, [isError, error, router]);

  if (!user || !canReadUsers || !canUpdateUsers) {
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
          <AddUser editUserId={userId} initialData={userData} />
        </div>
        <div>
          <UserHistory userId={userId} />
        </div>
      </div>
    </>
  );
};

export default EditUserPage;
