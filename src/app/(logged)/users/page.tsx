"use client"
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/UserContext";
import { FiPlus, FiUsers } from "react-icons/fi";

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
            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-5 shadow-sm sm:p-6">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
                    <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-100">
                                <FiUsers />
                                Administration
                            </p>
                            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                                System users
                            </h1>
                            <p className="mt-1 max-w-2xl text-sm text-slate-200/80">
                                Review user accounts, archive inactive users, and manage access across the workspace.
                            </p>
                        </div>
                        <Link
                            href="/users/add"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-950/20 transition hover:-translate-y-0.5"
                        >
                            <FiPlus />
                            Add user
                        </Link>
                    </div>
                </section>

                <div className="flex flex-col gap-6">
                    <UsersList />
                </div>
            </div>
        </>
    );
};

export default UsersPage;
