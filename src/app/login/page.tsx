"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { FiUser, FiLock, FiArrowRight } from "react-icons/fi";

const SignIn: React.FC = () => {
    const [user, setUser] = useState({ username: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            toast.loading("Authenticating...", { id: "login" });
            await axios.post("/api/users/auth/login", user);
            toast.success("Login successful! Redirecting...", { id: "login" });
            router.push("/");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Login Failed", { id: "login" });
            setIsLoading(false);
        }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setUser({ ...user, [event.target.name]: event.target.value });
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            
            {/* Ambient Background Features */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-teal-500/20 blur-[120px]" />
            </div>

            <div className="w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl ring-1 ring-slate-200/50 dark:ring-slate-800/50 relative z-10 flex flex-col lg:flex-row">
                
                {/* Visual Branding Section - Hidden on smaller screens */}
                <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 relative">
                    <div className="relative z-10">
                        <Link href="/">
                            <Image
                                className="hidden dark:block"
                                src={"/images/logo/logo.svg"}
                                alt="Zaad Logo"
                                width={180}
                                height={40}
                            />
                            <Image
                                className="dark:hidden"
                                src={"/images/logo/logo-dark.svg"}
                                alt="Zaad Logo"
                                width={180}
                                height={40}
                            />
                        </Link>
                    </div>

                    <div className="relative z-10 mt-20">
                        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">
                            Elevating<br/>Corporate<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Productivity.</span>
                        </h1>
                        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 font-medium max-w-sm">
                            Zaad Admin empowers your organization with intelligent tools for seamless compliance and operational excellence.
                        </p>
                    </div>

                    {/* Decorative Elements inside Branding Section */}
                    <div className="absolute bottom-12 right-12 w-32 h-32 border-[16px] border-emerald-500/10 dark:border-emerald-500/20 rounded-full" />
                    <div className="absolute top-1/2 right-0 translate-y-[-50%] translate-x-[50%] w-64 h-64 border-[32px] border-teal-500/10 dark:border-teal-500/20 rounded-full" />
                </div>

                {/* Login Form Section */}
                <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white dark:bg-slate-900">
                    
                    <div className="mb-10 lg:hidden">
                        <Image
                            className="hidden dark:block h-8 w-auto"
                            src={"/images/logo/logo.svg"}
                            alt="Zaad Logo"
                            width={140}
                            height={32}
                        />
                        <Image
                            className="dark:hidden h-8 w-auto"
                            src={"/images/logo/logo-dark.svg"}
                            alt="Zaad Logo"
                            width={140}
                            height={32}
                        />
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
                            Please enter your credentials to securely access your portal.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                                Username
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400">
                                    <FiUser className="text-xl" />
                                </span>
                                <input
                                    type="text"
                                    name="username"
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your username"
                                    className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-4 pl-12 pr-4 text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white dark:focus:border-emerald-500 dark:focus:bg-slate-900"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">
                                Password
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400">
                                    <FiLock className="text-xl" />
                                </span>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Enter your security phrase"
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-4 pl-12 pr-4 text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white dark:focus:border-emerald-500 dark:focus:bg-slate-900"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-center font-bold text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In to Dashboard</span>
                                        <FiArrowRight className="text-lg transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Secure enterprise portal &copy; {new Date().getFullYear()} Zaad Admin.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SignIn;
