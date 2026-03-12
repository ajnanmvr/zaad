"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useUserContext } from "@/contexts/UserContext";
import { FiEye, FiEyeOff, FiUserPlus, FiUserCheck, FiLock, FiUser, FiHash } from "react-icons/fi";
import clsx from "clsx";

interface AddUserProps {
    editUserId?: string;
    initialData?: {
        username: string;
        fullname: string;
        role: string;
    };
}

const AddUser = ({ editUserId, initialData }: AddUserProps) => {
    const router = useRouter();
    const { user: currentUser } = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [targetUserData, setTargetUserData] = useState(initialData);
    const [formData, setFormData] = useState({
        username: initialData?.username || "",
        fullname: initialData?.fullname || "",
        role: initialData?.role || "employee",
        password: "",
        confirmPassword: ""
    });

    const isEditMode = Boolean(editUserId);
    const isEditingOtherPartner = isEditMode &&
        targetUserData?.role === "partner" &&
        currentUser?.role === "partner" &&
        editUserId !== currentUser?._id;

    // Fetch target user data if not provided (for edit mode)
    useEffect(() => {
        if (isEditMode && !targetUserData && editUserId) {
            const fetchUserData = async () => {
                try {
                    const { data } = await axios.get(`/api/users/${editUserId}`);
                    setTargetUserData(data.user);
                } catch (error) {
                    console.error("Failed to fetch user data:", error);
                }
            };
            fetchUserData();
        }
    }, [isEditMode, targetUserData, editUserId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.username.trim()) {
            toast.error("Username is required");
            return false;
        }

        // Check if trying to change password of another partner
        if (isEditingOtherPartner && formData.password) {
            toast.error("Partners cannot change passwords of other partners");
            return false;
        }

        // Check if trying to downgrade another partner to employee
        if (isEditingOtherPartner && formData.role === "employee") {
            toast.error("Partners cannot downgrade other partners to employee role");
            return false;
        }

        if (!isEditMode || formData.password) {
            if (!formData.password) {
                toast.error("Password is required");
                return false;
            }

            if (formData.password.length < 6) {
                toast.error("Password must be at least 6 characters long");
                return false;
            }

            if (formData.password !== formData.confirmPassword) {
                toast.error("Passwords do not match");
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Additional confirmation for sensitive partner operations
        const isCreatingPartner = !isEditMode && formData.role === "partner";
        const isChangingToPartner = isEditMode && targetUserData?.role !== "partner" && formData.role === "partner";
        const isEditingPartner = isEditingOtherPartner;

        if (isCreatingPartner) {
            const confirmPartnerCreation = confirm(
                `⚠️ CREATING NEW PARTNER ⚠️\n\nYou are about to create a new PARTNER account: "${formData.username}"\n\nPartners have full administrative privileges including:\n- Managing all users\n- Accessing sensitive data\n- System configuration\n\nAre you sure you want to create this partner account?`
            );
            if (!confirmPartnerCreation) {
                setIsLoading(false);
                return;
            }
        }

        if (isChangingToPartner) {
            const confirmPromotion = confirm(
                `⚠️ PROMOTING TO PARTNER ⚠️\n\nYou are about to promote "${formData.username}" from ${targetUserData?.role} to PARTNER.\n\nThis will grant them full administrative privileges.\n\nAre you sure you want to proceed?`
            );
            if (!confirmPromotion) {
                setIsLoading(false);
                return;
            }
        }

        if (isEditingPartner) {
            const confirmPartnerEdit = confirm(
                `⚠️ EDITING PARTNER ACCOUNT ⚠️\n\nYou are about to modify another PARTNER account: "${targetUserData?.username}"\n\nThis is a sensitive operation. Are you sure you want to proceed?`
            );
            if (!confirmPartnerEdit) {
                setIsLoading(false);
                return;
            }
        }

        setIsLoading(true);

        try {
            const submitData: any = {
                username: formData.username.trim(),
                fullname: formData.fullname.trim(),
                role: formData.role
            };

            // Only include password if it's provided (for edit mode) or if it's create mode
            if (formData.password) {
                submitData.password = formData.password;
            }

            if (isEditMode) {
                await axios.put(`/api/users/${editUserId}`, submitData);
                toast.success("User updated successfully");
            } else {
                await axios.post("/api/users", submitData);
                toast.success("User created successfully");
            }

            router.push("/users");

        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Failed to save user";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // UI Styles
    const inputClass = "w-full appearance-none rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900";
    const labelClass = "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:ring-slate-800/50">
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-5 rounded-t-2xl dark:border-slate-800 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {isEditMode ? <FiUserCheck className="text-emerald-500" /> : <FiUserPlus className="text-emerald-500" />} 
                    {isEditMode ? "Edit User Account" : "Add New User"}
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Username */}
                    <div>
                        <label className={labelClass}>
                            Username <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <FiHash />
                            </span>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter username"
                                className={clsx(inputClass, "pl-11")}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className={labelClass}>
                            Full Name
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <FiUser />
                            </span>
                            <input
                                type="text"
                                name="fullname"
                                value={formData.fullname}
                                onChange={handleChange}
                                placeholder="Optional full name"
                                className={clsx(inputClass, "pl-11")}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>

                {/* Role */}
                <div className="mb-6">
                    <label className={labelClass}>
                        Account Role <span className="text-rose-500">*</span>
                        {isEditingOtherPartner && <span className="text-xs text-rose-500 ml-2 font-normal">(Cannot downgrade other partners)</span>}
                    </label>
                    <div className="rounded-xl border border-slate-200 p-2 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-2">
                        <label className={clsx(
                                "flex-1 cursor-pointer rounded-lg px-4 py-3 text-center transition-all",
                                formData.role === 'employee' ? "bg-white shadow-sm ring-1 ring-slate-200 text-emerald-700 font-bold dark:bg-slate-800 dark:ring-slate-700 dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                                isEditingOtherPartner && formData.role !== 'employee' && "opacity-50 cursor-not-allowed"
                            )}>
                            <input 
                                type="radio" 
                                name="role" 
                                value="employee" 
                                checked={formData.role === "employee"} 
                                onChange={handleChange} 
                                className="sr-only"
                                disabled={isLoading || isEditingOtherPartner}
                            />
                            Standard Employee
                        </label>
                        <label className={clsx(
                                "flex-1 cursor-pointer rounded-lg px-4 py-3 text-center transition-all",
                                formData.role === 'partner' ? "bg-white shadow-sm ring-1 ring-slate-200 text-teal-700 font-bold dark:bg-slate-800 dark:ring-slate-700 dark:text-teal-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            )}>
                            <input 
                                type="radio" 
                                name="role" 
                                value="partner" 
                                checked={formData.role === "partner"} 
                                onChange={handleChange} 
                                className="sr-only"
                                disabled={isLoading}
                            />
                            Administrator / Partner
                        </label>
                    </div>
                </div>

                <hr className="my-6 border-slate-200 dark:border-slate-700" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Password */}
                    <div>
                        <label className={labelClass}>
                            Password {!isEditMode && <span className="text-rose-500">*</span>}
                            {isEditMode && !isEditingOtherPartner && <span className="text-xs text-slate-500 ml-2 font-normal">(Leave blank to keep current)</span>}
                            {isEditingOtherPartner && <span className="text-xs text-rose-500 ml-2 font-normal">(Cannot edit partner password)</span>}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <FiLock />
                            </span>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={
                                    isEditingOtherPartner
                                        ? "Disabled"
                                        : isEditMode
                                            ? "New password"
                                            : "Min. 6 characters"
                                }
                                className={clsx(inputClass, "pl-11 pr-12")}
                                disabled={isLoading || isEditingOtherPartner}
                                required={!isEditMode}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                disabled={isEditingOtherPartner}
                            >
                                {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    {(!isEditMode || (formData.password && !isEditingOtherPartner)) && (
                        <div>
                            <label className={labelClass}>
                                Confirm Password <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <FiLock />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm password"
                                    className={clsx(inputClass, "pl-11 pr-12")}
                                    disabled={isLoading}
                                    required={!isEditMode || Boolean(formData.password)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? (isEditMode ? "Updating User..." : "Creating User...") : (isEditMode ? "Update User Configuration" : "Create User")}
                    </button>

                    <Link
                        href="/users"
                        className="flex-shrink-0 text-center rounded-xl bg-slate-100 px-8 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default AddUser;
