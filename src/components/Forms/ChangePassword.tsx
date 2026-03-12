"use client"
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = () => {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            toast.error("All fields are required");
            return false;
        }

        if (formData.newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long");
            return false;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("New passwords do not match");
            return false;
        }

        if (formData.currentPassword === formData.newPassword) {
            toast.error("New password must be different from current password");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await axios.put("/api/users/change-password", {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            toast.success("Password changed successfully");

            // Reset form
            setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Failed to change password";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 pr-12 text-slate-900 outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-500";
    const labelClasses = "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FiLock className="text-xl text-rose-500" />
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                            Change Password
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Update your password to keep your account secure
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                {/* Current Password */}
                <div className="mb-6">
                    <label className={labelClasses}>
                        Current Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type={showPasswords.current ? "text" : "password"}
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            placeholder="Enter your current password"
                            className={inputClasses}
                            disabled={isLoading}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                            {showPasswords.current ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                        </button>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 my-6"></div>

                {/* New Password */}
                <div className="mb-6 flex flex-col gap-6 sm:flex-row">
                    <div className="w-full sm:w-1/2">
                        <label className={labelClasses}>
                            New Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? "text" : "password"}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="Min. 6 characters"
                                className={inputClasses}
                                disabled={isLoading}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('new')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                                {showPasswords.new ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                            </button>
                        </div>
                    </div>

                    <div className="w-full sm:w-1/2">
                        <label className={labelClasses}>
                            Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Repeat new password"
                                className={inputClasses}
                                disabled={isLoading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                                {showPasswords.confirm ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => setFormData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: ""
                        })}
                        disabled={isLoading}
                        className="flex w-full sm:w-auto mt-2 sm:mt-0 justify-center rounded-xl border border-slate-300 bg-white px-8 py-3.5 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed md:order-1"
                    >
                        Clear
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex w-full sm:w-auto justify-center rounded-xl bg-emerald-600 px-8 py-3.5 font-medium text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed md:order-2"
                    >
                        {isLoading ? "Updating..." : "Update Password"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePassword;
