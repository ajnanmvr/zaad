"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { FiArrowRight } from "react-icons/fi";

const SignIn: React.FC = () => {
    const [user, setUser] = useState({ username: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const usernameFromForm = String(formData.get("username") || "").trim();
        const passwordFromForm = String(formData.get("password") || "");

        // Browser autofill can bypass onChange; always use live form values.
        const payload = {
            username: usernameFromForm || user.username.trim(),
            password: passwordFromForm || user.password,
        };

        if (!payload.username || !payload.password) {
            toast.error("Username and password are required", { id: "login" });
            return;
        }

        setIsLoading(true);
        try {
            toast.loading("Authenticating...", { id: "login" });
            await axios.post("/api/users/auth/login", payload);
            toast.success("Login successful! Redirecting...", { id: "login" });
            window.location.replace("/");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Login Failed", { id: "login" });
            setIsLoading(false);
        }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUser({ ...user, [event.target.name]: event.target.value });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-950">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-8 flex justify-center">
                    <Link href="/">
                        <Image
                            className="hidden dark:block"
                            src="/images/logo/logo.svg"
                            alt="Zaad Logo"
                            width={150}
                            height={36}
                        />
                        <Image
                            className="dark:hidden"
                            src="/images/logo/logo-dark.svg"
                            alt="Zaad Logo"
                            width={150}
                            height={36}
                        />
                    </Link>
                </div>

                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your username and password.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                        <input
                            type="text"
                            name="username"
                            onChange={handleChange}
                            onInput={handleChange}
                            required
                            placeholder="Username"
                            autoComplete="username"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-500"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            onChange={handleChange}
                            onInput={handleChange}
                            required
                            autoComplete="current-password"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-500"
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isLoading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <FiArrowRight className="text-base" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    Secure portal © {new Date().getFullYear()} Zaad
                </p>
            </div>
        </div>
    );
};

export default SignIn;
