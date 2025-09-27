"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useUserContext } from "@/contexts/UserContext";

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

    return (
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                    {isEditMode ? "Edit User" : "Add New User"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isEditMode ? "Update user information" : "Create a new user account"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6.5">
                {/* Username */}
                <div className="mb-4.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Username <span className="text-meta-1">*</span>
                    </label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter username"
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        disabled={isLoading}
                        required
                    />
                </div>

                {/* Full Name */}
                <div className="mb-4.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Full Name
                    </label>
                    <input
                        type="text"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleChange}
                        placeholder="Enter full name (optional)"
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        disabled={isLoading}
                    />
                </div>

                {/* Role */}
                <div className="mb-4.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Role <span className="text-meta-1">*</span>
                        {isEditingOtherPartner && <span className="text-xs text-red-500 ml-2">(cannot downgrade other partners)</span>}
                    </label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        disabled={isLoading}
                        required
                    >
                        <option value="employee" disabled={isEditingOtherPartner}>Employee</option>
                        <option value="partner">Partner</option>
                    </select>
                </div>

                {/* Password */}
                <div className="mb-4.5">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Password {!isEditMode && <span className="text-meta-1">*</span>}
                        {isEditMode && !isEditingOtherPartner && <span className="text-xs text-gray-500 ml-2">(leave empty to keep current)</span>}
                        {isEditingOtherPartner && <span className="text-xs text-red-500 ml-2">(partners cannot change other partners&apos; passwords)</span>}
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={
                                isEditingOtherPartner
                                    ? "Password editing disabled"
                                    : isEditMode
                                        ? "Enter new password (optional)"
                                        : "Enter password (min. 6 characters)"
                            }
                            className={`w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 pr-12 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary ${isEditingOtherPartner ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                            disabled={isLoading || isEditingOtherPartner}
                            required={!isEditMode}
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            disabled={isEditingOtherPartner}
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878A3 3 0 1015.12 15.12m-5.242 5.242l-4.242-4.242m0 0a10.05 10.05 0 01-5.986-4.985m0 0L3.707 20.293m0-10.586L20.293 3.707" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                {(!isEditMode || (formData.password && !isEditingOtherPartner)) && (
                    <div className="mb-6">
                        <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                            Confirm Password <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm password"
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                            disabled={isLoading}
                            required={!isEditMode || Boolean(formData.password)}
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update User" : "Create User")}
                    </button>

                    <Link
                        href="/users"
                        className="flex justify-center rounded border border-stroke px-6 py-2 font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-boxdark"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default AddUser;