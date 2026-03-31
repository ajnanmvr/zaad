"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { TBaseData } from "@/types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { debounce } from "lodash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiTrash2, FiPlus, FiUser, FiLock, FiFileText } from "react-icons/fi";
import clsx from "clsx";

const AddEmployee = ({ company, edit }: { company?: string | string[], edit?: string | string[] }) => {
    const router = useRouter()
    const queryClient = useQueryClient();
    const [searchSuggestions, setSearchSuggestions] = useState<TBaseData[]>([]);
    const [searchValue, setSearchValue] = useState<string>("");
    const [isEditMode, setisEditMode] = useState(false);
    const [employeeData, setEmployeeData] = useState<any>({
        name: "", company: "", documents: [], password: []
    });
    const [documentNameOptionsByCategory, setDocumentNameOptionsByCategory] =
        useState<Record<string, string[]>>({});
    const [credentialPlatformOptionsByCategory, setCredentialPlatformOptionsByCategory] =
        useState<Record<string, string[]>>({});
    const [documentCategoryOptions, setDocumentCategoryOptions] = useState<string[]>([]);
    const [credentialCategoryOptions, setCredentialCategoryOptions] = useState<string[]>([]);

    const normalizeCategoryKey = (value: string) => value.trim().toLowerCase();

    const fetchCategoryOptions = useCallback(async (
        type: "document" | "credential",
        category: string,
    ) => {
        const trimmed = category.trim();
        if (!trimmed) return;

        const key = normalizeCategoryKey(trimmed);
        if (
            (type === "document" && documentNameOptionsByCategory[key]) ||
            (type === "credential" && credentialPlatformOptionsByCategory[key])
        ) {
            return;
        }

        try {
            const { data } = await axios.get("/api/categories/names", {
                params: { type, category: trimmed },
            });
            const options: string[] = Array.isArray(data?.options) ? data.options : [];

            if (type === "document") {
                setDocumentNameOptionsByCategory((prev) => ({ ...prev, [key]: options }));
                return;
            }

            setCredentialPlatformOptionsByCategory((prev) => ({ ...prev, [key]: options }));
        } catch (error) {
            console.error("Error fetching category options:", error);
        }
    }, [credentialPlatformOptionsByCategory, documentNameOptionsByCategory]);

    const fetchCategoryLists = useCallback(async () => {
        try {
            const [documentRes, credentialRes] = await Promise.all([
                axios.get("/api/categories", { params: { type: "document" } }),
                axios.get("/api/categories", { params: { type: "credential" } }),
            ]);

            setDocumentCategoryOptions(
                Array.isArray(documentRes.data?.options) ? documentRes.data.options : []
            );
            setCredentialCategoryOptions(
                Array.isArray(credentialRes.data?.options) ? credentialRes.data.options : []
            );
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }, []);

    useEffect(() => {
        if (company) {
            setEmployeeData((prev: any) => ({ ...prev, company }))
        }
    }, [company])

    const { data } = useQuery<any>({
        queryKey: [`${edit}`], queryFn: async () => {
            const { data } = await axios.get(`/api/employee/${edit}`);
            return (data.data);
        },
        enabled: edit !== "" && edit !== undefined
    });

    useEffect(() => {
        if (edit && data) {
            setisEditMode(true)
            setEmployeeData(data || { name: "", company: "", documents: [], password: [] })
            if (data?.company?.name) {
                setSearchValue(data.company.name)
            }
        } else if (!edit) {
            setisEditMode(false)
        }
    }, [edit, data])

    useEffect(() => {
        void fetchCategoryLists();
    }, [fetchCategoryLists]);

    useEffect(() => {
        const documentCategories = Array.from(
            new Set<string>(
                (employeeData?.documents || [])
                    .map((doc: any) => doc?.category?.trim())
                    .filter((category: string | undefined): category is string => Boolean(category))
            )
        );

        const credentialCategories = Array.from(
            new Set<string>(
                (employeeData?.password || [])
                    .map((item: any) => item?.category?.trim())
                    .filter((category: string | undefined): category is string => Boolean(category))
            )
        );

        documentCategories.forEach((category) => {
            void fetchCategoryOptions("document", category);
        });

        credentialCategories.forEach((category) => {
            void fetchCategoryOptions("credential", category);
        });
    }, [employeeData?.documents, employeeData?.password, fetchCategoryOptions])

    const mutation = useMutation(
        {
            mutationFn: async (employeeData) => {
                if (isEditMode) {
                    await axios.put(`/api/employee/${edit}`, employeeData);
                } else {
                    await axios.post("/api/employee", employeeData);
                }
            },
            onMutate: () => {
                toast.loading("Saving employee details...");
            },
            onSuccess: () => {
                if (isEditMode) {
                    router.replace(`/employee/${edit}`);
                } else {
                    router.push("/employee");
                }
                toast.dismiss()
                toast.success("Employee details saved successfully!");
                queryClient.invalidateQueries({ queryKey: ["employees"] });
            },
            onError: () => {
                toast.dismiss()
                toast.error("Failed to save employee details");
            }
        }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(employeeData);
    };

    const fetchsearchSuggestions = async (inputValue: string, inputName: string) => {
        try {
            const response = await axios.get<TBaseData[]>(`/api/${inputName}/search/${inputValue}`);
            setSearchSuggestions(response.data);
        } catch (error) {
            console.error("Error fetching company suggestions:", error);
        }
    };

    const debounceSearch = debounce((input: string, name: string) => {
        fetchsearchSuggestions(input, name);
    }, 300);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value)
        const inputName = e.target.name;
        debounceSearch(e.target.value, inputName);
    };

    const handleCompanySelection = (selected: TBaseData) => {
        setSearchValue(selected.name)
        setEmployeeData({ ...employeeData, company: selected._id });
        setSearchSuggestions([])
    };

    const handleDeleteDocument = (index: number) => {
        const updatedItems = employeeData.documents.filter((doc: any, docIndex: number) => docIndex !== index);
        setEmployeeData({ ...employeeData, documents: updatedItems });
    };

    const handleDeletePassword = (index: number) => {
        const updatedItems = employeeData.password?.filter((doc: any, docIndex: number) => docIndex !== index) || [];
        setEmployeeData({ ...employeeData, password: updatedItems });
    };

    const handlePasswordChange = (index: number, field: string, value: string) => {
        const updatedPasswords = [...(employeeData.password || [])];
        if (updatedPasswords[index]) {
            updatedPasswords[index][field] = value;
            setEmployeeData({ ...employeeData, password: updatedPasswords });
        }
    };

    const handleAddPassword = (e: React.MouseEvent) => {
        e.preventDefault()
        const password = { category: "", platform: "", username: "", password: "" }
        if (!employeeData.password) {
            setEmployeeData({ ...employeeData, password: [password] })
        } else {
            const updatedPasswords = [...employeeData.password, password];
            setEmployeeData({ ...employeeData, password: updatedPasswords });
        }
    };

    const handleAddDocument = (e: React.MouseEvent) => {
        e.preventDefault()
        const documents = { category: "", name: "", issueDate: "", expiryDate: "", notes: "" }
        if (!employeeData.documents) {
            setEmployeeData({ ...employeeData, documents: [documents] })
        } else {
            const updatedDocuments = [...employeeData.documents, documents];
            setEmployeeData({ ...employeeData, documents: updatedDocuments });
        }
    };

    const handleDocumentChange = (index: number, field: string, value: string | Date) => {
        const updatedDocuments = [...(employeeData.documents || [])];
        if (updatedDocuments[index]) {
            if (field === "category") {
                updatedDocuments[index].name = "";
            }
            updatedDocuments[index][field] = value;
            setEmployeeData({ ...employeeData, documents: updatedDocuments });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEmployeeData({
            ...employeeData,
            [e.target.name]: e.target.value
        })
    }

    const breadCrumb = isEditMode ? "Edit Employee" : "Add Employee"
    const confirmBtn = isEditMode ? "Save Changes" : "Create Employee"
    const cancelLink = isEditMode ? `/employee/${edit}` : "/employee"

    const inputClasses = "w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary w-full";
    const labelClasses = "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Breadcrumb pageName={breadCrumb} />

            <form className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-12" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-8 xl:col-span-7">
                    {/* Employee Details Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
                        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center gap-3">
                            <FiUser className="text-xl text-primary" />
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                                Employee Details
                            </h3>
                        </div>
                        <div className="p-6 sm:p-8">
                            <div className="mb-6">
                                <label className={labelClasses}>
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={employeeData?.name || ""}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter employee full name"
                                    className={inputClasses}
                                />
                            </div>

                            {!company && (
                                <div className="mb-6 relative">
                                    <label className={labelClasses}>
                                        Company Association
                                    </label>
                                    <input
                                        type="text"
                                        name="company"
                                        autoComplete="off"
                                        value={searchValue}
                                        onChange={handleInputChange}
                                        placeholder="Search and select company..."
                                        className={inputClasses}
                                    />
                                    {searchSuggestions.length > 0 && (
                                        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                            <ul className="max-h-60 overflow-y-auto">
                                                {searchSuggestions.map((comp, key) => (
                                                    <li
                                                        key={key}
                                                        onClick={() => handleCompanySelection(comp)}
                                                        className="cursor-pointer px-5 py-3 text-slate-700 transition hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-white"
                                                    >
                                                        {comp.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mb-6 flex flex-col gap-6 sm:flex-row">
                                <div className="w-full sm:w-1/2">
                                    <label className={labelClasses}>Emirates ID</label>
                                    <input
                                        type="text"
                                        name="emiratesId"
                                        value={employeeData?.emiratesId || ""}
                                        onChange={handleChange}
                                        placeholder="784-XXXX-XXXXXXX-X"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className={labelClasses}>Nationality</label>
                                    <input
                                        type="text"
                                        name="nationality"
                                        value={employeeData?.nationality || ""}
                                        onChange={handleChange}
                                        placeholder="e.g. Indian, British"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className={labelClasses}>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={employeeData?.email || ""}
                                    onChange={handleChange}
                                    placeholder="employee@company.com"
                                    className={inputClasses}
                                />
                            </div>

                            <div className="mb-6 flex flex-col gap-6 sm:flex-row">
                                <div className="w-full sm:w-1/2">
                                    <label className={labelClasses}>Primary Phone</label>
                                    <input
                                        type="text"
                                        name="phone1"
                                        value={employeeData?.phone1 || ""}
                                        onChange={handleChange}
                                        placeholder="+971 50 XXXXXXX"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className={labelClasses}>Secondary Phone</label>
                                    <input
                                        type="text"
                                        name="phone2"
                                        value={employeeData?.phone2 || ""}
                                        onChange={handleChange}
                                        placeholder="Alternative number"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className={labelClasses}>Designation</label>
                                <input
                                    type="text"
                                    name="designation"
                                    value={employeeData?.designation || ""}
                                    onChange={handleChange}
                                    placeholder="e.g. Software Engineer, Manager"
                                    className={inputClasses}
                                />
                            </div>

                            <div className="mb-8">
                                <label className={labelClasses}>Remarks / Notes</label>
                                <textarea
                                    rows={4}
                                    name="remarks"
                                    placeholder="Enter any additional details here..."
                                    value={employeeData?.remarks || ""}
                                    onChange={handleChange}
                                    className={clsx(inputClasses, "resize-none")}
                                ></textarea>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
                                <Link 
                                    href={cancelLink} 
                                    className="flex w-full sm:w-auto justify-center rounded-xl border border-slate-300 bg-white px-8 py-3.5 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 md:order-1"
                                >
                                    Cancel
                                </Link>
                                <button 
                                    type="submit" 
                                    className="flex w-full sm:w-auto justify-center rounded-xl bg-primary px-8 py-3.5 font-medium text-white transition hover:bg-opacity-90 shadow-sm shadow-primary/30 md:order-2"
                                >
                                    {confirmBtn}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8 xl:col-span-5">
                    {/* Passwords Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
                        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FiLock className="text-xl text-emerald-500" />
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                                    Platform Access
                                </h3>
                            </div>
                        </div>
                        <div className="px-6 py-6 sm:p-8">
                            {(!employeeData?.password || employeeData?.password.length === 0) && (
                                <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                                    No platform passwords added yet.
                                </div>
                            )}

                            {employeeData?.password?.map((item: any, index: number) => (
                                <div key={index} className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50 relative group">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeletePassword(index);
                                        }}
                                        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-md bg-white text-rose-500 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                        title="Remove Platform"
                                    >
                                        <FiTrash2 />
                                    </button>
                                    
                                    <div className="mb-4 pr-10">
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</label>
                                        <input
                                            type="text"
                                            list="employee-credential-category-options"
                                            value={item?.category || ""}
                                            placeholder="Select or type category"
                                            onChange={(e) => handlePasswordChange(index, 'category', e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                        />
                                    </div>
                                    <div className="mb-4 pr-10">
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Platform</label>
                                        <input
                                            type="text"
                                            list={`employee-platform-options-${index}`}
                                            value={item?.platform || ""}
                                            placeholder="e.g. Portal"
                                            onChange={(e) => handlePasswordChange(index, 'platform', e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                        />
                                        <datalist id={`employee-platform-options-${index}`}>
                                            {(credentialPlatformOptionsByCategory[normalizeCategoryKey(item?.category || "")] || []).map((option) => (
                                                <option key={option} value={option} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Username</label>
                                            <input
                                                type="text"
                                                value={item?.username || ""}
                                                onChange={(e) => handlePasswordChange(index, 'username', e.target.value)}
                                                placeholder="Username"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
                                            <input
                                                type="text"
                                                value={item?.password || ""}
                                                onChange={(e) => handlePasswordChange(index, 'password', e.target.value)}
                                                placeholder="Password"
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button 
                                onClick={handleAddPassword} 
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-3 font-medium text-slate-600 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                            >
                                <FiPlus className="text-lg" />
                                Add Platform Credentials
                            </button>
                        </div>
                    </div>

                    {/* Documents Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
                        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FiFileText className="text-xl text-emerald-500" />
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                                    Employee Documents
                                </h3>
                            </div>
                        </div>
                        <div className="px-6 py-6 sm:p-8">
                            {(!employeeData?.documents || employeeData?.documents.length === 0) && (
                                <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                                    No documents attached yet.
                                </div>
                            )}

                            {employeeData?.documents?.map((doc: any, index: number) => (
                                <div key={index} className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50 relative group">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleDeleteDocument(index)
                                        }}
                                        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-md bg-white text-rose-500 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                        title="Remove Document"
                                    >
                                        <FiTrash2 />
                                    </button>

                                    <div className="mb-4 pr-10">
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Category
                                        </label>
                                        <input
                                            type="text"
                                            list="employee-document-category-options"
                                            value={doc?.category || ""}
                                            onChange={(e) => handleDocumentChange(index, 'category', e.target.value)}
                                            placeholder="Select or type category"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                        />
                                    </div>
                                    <div className="mb-4 pr-10">
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Document Name <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            title="Select document name"
                                            required
                                            value={doc?.name || ""}
                                            onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                        >
                                            <option value="" disabled>
                                                {doc?.category ? "Select document" : "Select category first"}
                                            </option>
                                            {(documentNameOptionsByCategory[normalizeCategoryKey(doc?.category || "")] || []).map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                            {doc?.name &&
                                                !(documentNameOptionsByCategory[normalizeCategoryKey(doc?.category || "")] || []).includes(doc.name) && (
                                                    <option value={doc.name}>{doc.name}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Issue Date</label>
                                            <input
                                                type="date"
                                                value={doc?.issueDate || ""}
                                                onChange={(e) => handleDocumentChange(index, 'issueDate', e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                Expiry Date <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={doc?.expiryDate || ""}
                                                onChange={(e) => handleDocumentChange(index, 'expiryDate', e.target.value)}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Notes
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={doc?.notes || ""}
                                            onChange={(e) => handleDocumentChange(index, 'notes', e.target.value)}
                                            placeholder="Optional notes"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            ))}

                            <button 
                                onClick={handleAddDocument} 
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-3 font-medium text-slate-600 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                            >
                                <FiPlus className="text-lg" />
                                Add Document
                            </button>
                            <datalist id="employee-document-category-options">
                                {documentCategoryOptions.map((category) => (
                                    <option key={category} value={category} />
                                ))}
                            </datalist>
                            <datalist id="employee-credential-category-options">
                                {credentialCategoryOptions.map((category) => (
                                    <option key={category} value={category} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddEmployee;
