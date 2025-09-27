"use client"
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ChangePassword from "@/components/Forms/ChangePassword";
import { useUserContext } from "@/contexts/UserContext";

const SettingsPage = () => {
    const { user } = useUserContext();

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Settings" />

            <div className="grid grid-cols-1 gap-9">
                {/* User Information */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">
                            User Information
                        </h3>
                    </div>
                    <div className="p-6.5">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Username
                                </label>
                                <div className="rounded border-[1.5px] border-stroke bg-gray-50 px-5 py-3 text-black dark:border-form-strokedark dark:bg-form-input dark:text-white">
                                    {user?.username || "Loading..."}
                                </div>
                            </div>
                            <div>
                                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                    Role
                                </label>
                                <div className="rounded border-[1.5px] border-stroke bg-gray-50 px-5 py-3 text-black dark:border-form-strokedark dark:bg-form-input dark:text-white capitalize">
                                    {user?.role || "Loading..."}
                                </div>
                            </div>
                            {user?.fullname && (
                                <div className="sm:col-span-2">
                                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                                        Full Name
                                    </label>
                                    <div className="rounded border-[1.5px] border-stroke bg-gray-50 px-5 py-3 text-black dark:border-form-strokedark dark:bg-form-input dark:text-white">
                                        {user.fullname}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <ChangePassword />
            </div>
        </DefaultLayout>
    );
};

export default SettingsPage;