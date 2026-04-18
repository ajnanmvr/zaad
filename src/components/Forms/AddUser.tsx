"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useUserContext } from "@/contexts/UserContext";
import { FiEye, FiEyeOff, FiUserPlus, FiUserCheck, FiLock, FiUser, FiHash } from "react-icons/fi";
import clsx from "clsx";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

interface AddUserProps {
    editUserId?: string;
    initialData?: {
        username: string;
        fullname: string;
        role: string;
    };
}

type RoleOption = {
    name: string;
    permissions: string[];
};

const AddUser = ({ editUserId, initialData }: AddUserProps) => {
    const router = useRouter();
    const { user: currentUser } = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const [confirmContext, setConfirmContext] = useState<
        null | "create-admin" | "promote-admin" | "edit-admin"
    >(null);
    const [showPassword, setShowPassword] = useState(false);
    const [targetUserData, setTargetUserData] = useState(initialData);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [formData, setFormData] = useState({
        username: initialData?.username || "",
        fullname: initialData?.fullname || "",
        role: initialData?.role || "",
        password: "",
        confirmPassword: ""
    });

    const isEditMode = Boolean(editUserId);
    const initialRole = initialData?.role;
    const currentUserIsAdmin = Array.isArray(currentUser?.permissions) && currentUser.permissions.includes("admin.access");
    const targetRoleIsAdmin = Boolean(
        targetUserData?.role && roles.find((role) => role.name === targetUserData.role)?.permissions?.includes("admin.access")
    );
    const isEditingOtherAdmin = isEditMode &&
        targetRoleIsAdmin &&
        currentUserIsAdmin &&
        editUserId !== currentUser?._id;

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const { data } = await axios.get("/api/roles");
                const fetchedRoles = Array.isArray(data?.roles)
                    ? data.roles.map((role: any) => ({
                          name: role.name,
                          permissions: Array.isArray(role.permissions)
                              ? role.permissions
                              : [],
                      }))
                    : [];

                setRoles(fetchedRoles);

                if (!initialRole && fetchedRoles.length > 0) {
                    setFormData((prev) => ({ ...prev, role: fetchedRoles[0].name }));
                }
            } catch {
                setRoles([]);
                toast.error("Unable to load roles. Please try again.");
            }
        };

        fetchRoles();
    }, [initialRole]);

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

        // Prevent password changes for another admin account from this form
        if (isEditingOtherAdmin && formData.password) {
            toast.error("Admin users cannot change passwords of other admin users");
            return false;
        }

        const selectedRole = roles.find((role) => role.name === formData.role);
        const selectedIsAdmin = Boolean(selectedRole?.permissions?.includes("admin.access"));

        if (isEditingOtherAdmin && !selectedIsAdmin) {
            toast.error("Admin users cannot downgrade other admin users");
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

    const executeSubmit = async () => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        const targetIsAdmin = Boolean(
            targetUserData?.role && roles.find((role) => role.name === targetUserData.role)?.permissions?.includes("admin.access")
        );
        const selectedIsAdmin = Boolean(
            roles.find((role) => role.name === formData.role)?.permissions?.includes("admin.access")
        );

        const isCreatingAdmin = !isEditMode && selectedIsAdmin;
        const isChangingToAdmin = isEditMode && !targetIsAdmin && selectedIsAdmin;
        const isEditingAdmin = isEditingOtherAdmin;

        if (isCreatingAdmin) {
            setConfirmContext("create-admin");
            return;
        }

        if (isChangingToAdmin) {
            setConfirmContext("promote-admin");
            return;
        }

        if (isEditingAdmin) {
            setConfirmContext("edit-admin");
            return;
        }

        await executeSubmit();
    };

    const confirmMessage =
        confirmContext === "create-admin"
            ? `You are about to create an ADMIN account: "${formData.username}".`
            : confirmContext === "promote-admin"
                ? `You are about to promote "${formData.username}" from ${targetUserData?.role} to ${formData.role}.`
                : confirmContext === "edit-admin"
                    ? `You are about to modify another ADMIN account: "${targetUserData?.username}".`
                    : "";

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // UI Styles
    const inputClass = "w-full appearance-none rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900";
    const labelClass = "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/50 dark:border-slate-800 dark:bg-slate-900/50 dark:ring-slate-800/50">
            <ConfirmationModal
                isOpen={Boolean(confirmContext)}
                title="Sensitive Admin Operation"
                message={`${confirmMessage} This action affects administrative access. Continue?`}
                confirmLabel="Proceed"
                cancelLabel="Cancel"
                variant="warning"
                isLoading={isLoading}
                onCancel={() => setConfirmContext(null)}
                onConfirm={() => {
                    setConfirmContext(null);
                    void executeSubmit();
                }}
            />

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
                        {isEditingOtherAdmin && <span className="text-xs text-rose-500 ml-2 font-normal">(Cannot downgrade other admin users)</span>}
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className={inputClass}
                        disabled={isLoading || isEditingOtherAdmin}
                        required
                    >
                        {roles.length === 0 && (
                            <option value="" disabled>
                                No roles available
                            </option>
                        )}
                        {roles.map((role) => (
                            <option key={role.name} value={role.name}>
                                {role.name}
                            </option>
                        ))}
                    </select>
                </div>

                <hr className="my-6 border-slate-200 dark:border-slate-700" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Password */}
                    <div>
                        <label className={labelClass}>
                            Password {!isEditMode && <span className="text-rose-500">*</span>}
                            {isEditMode && !isEditingOtherAdmin && <span className="text-xs text-slate-500 ml-2 font-normal">(Leave blank to keep current)</span>}
                            {isEditingOtherAdmin && <span className="text-xs text-rose-500 ml-2 font-normal">(Cannot edit admin password)</span>}
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
                                    isEditingOtherAdmin
                                        ? "Disabled"
                                        : isEditMode
                                            ? "New password"
                                            : "Min. 6 characters"
                                }
                                className={clsx(inputClass, "pl-11 pr-12")}
                                disabled={isLoading || isEditingOtherAdmin}
                                required={!isEditMode}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                disabled={isEditingOtherAdmin}
                            >
                                {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    {(!isEditMode || (formData.password && !isEditingOtherAdmin)) && (
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
