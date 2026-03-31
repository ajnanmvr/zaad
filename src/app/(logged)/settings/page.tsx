"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ChangePassword from "@/components/Forms/ChangePassword";
import SessionManager from "@/components/Settings/SessionManager";
import { useUserContext } from "@/contexts/UserContext";
import { FiUser, FiShield, FiBriefcase } from "react-icons/fi";

const SettingsPage = () => {
    const { user } = useUserContext();

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Breadcrumb pageName="Account Settings" />

            <div className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-12">
                <div className="flex flex-col gap-8 xl:col-span-5">
                    {/* User Information Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
                        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center gap-3">
                            <FiUser className="text-xl text-emerald-500" />
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                                Profile Information
                            </h3>
                        </div>
                        <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
                                    <FiUser className="text-3xl opacity-80" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                                        {user?.fullname || user?.username || "Loading..."}
                                    </h4>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize flex items-center gap-1.5 mt-1">
                                        <FiBriefcase className="opacity-70" /> {user?.role || "User"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Username
                                    </label>
                                    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 cursor-not-allowed">
                                        {user?.username || "..."}
                                    </div>
                                </div>
                                
                                {user?.fullname && (
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Full Name
                                        </label>
                                        <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 cursor-not-allowed">
                                            {user.fullname}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Account Role
                                    </label>
                                    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 capitalize cursor-not-allowed flex items-center justify-between">
                                        {user?.role || "..."}
                                        <FiShield className="text-emerald-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8 xl:col-span-7">
                    {/* Change Password Component */}
                    <ChangePassword />
                    <SessionManager />
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
