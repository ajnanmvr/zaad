"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiTrash2, FiPlus, FiBriefcase, FiLock, FiFileText } from "react-icons/fi";
import clsx from "clsx";

const AddCompany = ({ edit }: { edit: string | string[] }) => {
    const router = useRouter()
    const queryClient = useQueryClient();
    const [isEditMode, setisEditMode] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string>("");
    const [isOptionSelected, setIsOptionSelected] = useState<boolean>(false);
    const [companyData, setCompanyData] = useState<any>({
        name: "", documents: [], password: []
    });
    const [documentTemplateOptions, setDocumentTemplateOptions] = useState<
        Array<{ id: string; name: string }>
    >([]);
    const [credentialTemplateOptions, setCredentialTemplateOptions] = useState<
        Array<{ id: string; platform: string }>
    >([]);

    const fetchTemplateLists = useCallback(async () => {
        try {
            const [documentRes, credentialRes] = await Promise.all([
                axios.get("/api/templates", { params: { type: "document" } }),
                axios.get("/api/templates", { params: { type: "credential" } }),
            ]);

            setDocumentTemplateOptions(
                Array.isArray(documentRes.data?.options) ? documentRes.data.options : []
            );
            setCredentialTemplateOptions(
                Array.isArray(credentialRes.data?.options) ? credentialRes.data.options : []
            );
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    }, []);

    const { data } = useQuery<any>({
        queryKey: [`${edit}`], queryFn: async () => {
            const { data } = await axios.get(`/api/company/${edit}`);
            return (data.data);
        },
        enabled: edit !== ""
    });

    useEffect(() => {
        if (companyData.isMainland) {
            setIsOptionSelected(true);
        }
    }, [companyData?.isMainland])

    useEffect(() => {
        if (edit !== "") {
            setisEditMode(true)
            setCompanyData(data || { name: "", documents: [], password: [] })
        } else {
            setisEditMode(false)
        }
    }, [edit, data])

    useEffect(() => {
        void fetchTemplateLists();
    }, [fetchTemplateLists]);

    const mutation = useMutation(
        {
            mutationFn: async (companyData) => {
                if (isEditMode) {
                    await axios.put(`/api/company/${edit}`, companyData);
                } else {
                    await axios.post("/api/company", companyData);
                }
            },
            onMutate: () => {
                toast.loading("Saving company details...");
            },
            onSuccess: () => {
                if (isEditMode) {
                    router.replace(`/company/${edit}`);
                } else {
                    router.push("/company");
                }
                toast.dismiss()
                toast.success("Company details saved successfully!");
                queryClient.invalidateQueries({ queryKey: ["companies"] });
            },
            onError: () => {
                toast.dismiss()
                toast.error("Failed to save company details");
            }
        }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(companyData);
    };

    const handleDeleteDocument = (index: number) => {
        const updatedItems = companyData.documents.filter((doc: any, docIndex: number) => docIndex !== index);
        setCompanyData({ ...companyData, documents: updatedItems });
    };

    const handleDeletePassword = (index: number) => {
        const updatedItems = companyData.password.filter((doc: any, docIndex: number) => docIndex !== index);
        setCompanyData({ ...companyData, password: updatedItems });
    };

    const handlePasswordChange = (index: number, field: string, value: string) => {
        const updatedPasswords = [...companyData.password];
        if (field === "credentialTemplate") {
            const selectedTemplate = credentialTemplateOptions.find(
                (template) => template.id === value,
            );
            updatedPasswords[index].platform = selectedTemplate?.platform || "";
        }
        updatedPasswords[index][field] = value;
        setCompanyData({ ...companyData, password: updatedPasswords });
    };

    const handleAddPassword = (e: React.MouseEvent) => {
        e.preventDefault()
        const password = {
            credentialTemplate: "",
            platform: "",
            username: "",
            password: "",
            notes: "",
        }
        if (!companyData.password) {
            setCompanyData({ ...companyData, password: [password] })
        } else {
            const updatedPasswords = [...companyData.password, password];
            setCompanyData({ ...companyData, password: updatedPasswords });
        }
    };

    const handleAddDocument = (e: React.MouseEvent) => {
        e.preventDefault()
        const documents = {
            documentTemplate: "",
            name: "",
            issueDate: "",
            expiryDate: "",
            notes: "",
        }
        if (!companyData.documents) {
            setCompanyData({ ...companyData, documents: [documents] })
        } else {
            const updatedDocuments = [...companyData.documents, documents];
            setCompanyData({ ...companyData, documents: updatedDocuments });
        }
    };

    const handleDocumentChange = (index: number, field: string, value: string | Date) => {
        const updatedDocuments = [...companyData.documents];
        if (field === "documentTemplate") {
            const selectedTemplate = documentTemplateOptions.find(
                (template) => template.id === value,
            );
            updatedDocuments[index].name = selectedTemplate?.name || "";
        }
        updatedDocuments[index][field] = value;
        setCompanyData({ ...companyData, documents: updatedDocuments });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setCompanyData({
            ...companyData,
            [e.target.name]: e.target.value
        })
    }

    const breadCrumb = isEditMode ? "Edit Company" : "Add Company"
    const confirmBtn = isEditMode ? "Save Changes" : "Create Company"

    const inputClasses = "w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition-all duration-300 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary";
    const labelClasses = "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Breadcrumb pageName={breadCrumb} />

            <form className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-12" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-8 xl:col-span-7">
                    {/* Company Details Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50 overflow-hidden">
                        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center gap-3">
                            <FiBriefcase className="text-xl text-primary" />
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                                Company Details
                            </h3>
                        </div>
                        <div className="p-6 sm:p-8">
                            <div className="mb-6">
                                <label className={labelClasses}>
                                    Company Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={companyData?.name || ""}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter company name"
                                    className={inputClasses}
                                />
                            </div>

                            <div className="mb-6 flex flex-col gap-6 sm:flex-row">
                                <div className="w-full sm:w-1/2">
                                    <label className={labelClasses}>License Number</label>
                                    <input
                                        type="text"
                                        name="licenseNo"
                                        value={companyData?.licenseNo || ""}
                                        onChange={handleChange}
                                        placeholder="Enter license number"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className={labelClasses}>Company Type</label>
                                    <input
                                        type="text"
                                        name="companyType"
                                        value={companyData?.companyType || ""}
                                        onChange={handleChange}
                                        placeholder="E.g., LLC, Corporation"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className={labelClasses}>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={companyData?.email || ""}
                                    onChange={handleChange}
                                    placeholder="contact@company.com"
                                    className={inputClasses}
                                />
                            </div>

                            <div className="mb-6 flex flex-col gap-6 sm:flex-row">
                                <div className="w-full sm:w-1/2">
                                    <label className={labelClasses}>Primary Phone</label>
                                    <input
                                        type="text"
                                        name="phone1"
                                        value={companyData?.phone1 || ""}
                                        onChange={handleChange}
                                        placeholder="e.g. +971 50 XXXXXXX"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className={labelClasses}>Secondary Phone</label>
                                    <input
                                        type="text"
                                        name="phone2"
                                        value={companyData?.phone2 || ""}
                                        onChange={handleChange}
                                        placeholder="Alternative number"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="mb-6 flex flex-col gap-6 sm:flex-row">
                                <div className="w-full sm:w-1/2">
                                    <label className={labelClasses}>Emirates / Area</label>
                                    <input
                                        type="text"
                                        name="emirates"
                                        value={companyData?.emirates || ""}
                                        onChange={handleChange}
                                        placeholder="e.g. Dubai"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className={labelClasses}>Transaction Number</label>
                                    <input
                                        type="text"
                                        name="transactionNo"
                                        value={companyData?.transactionNo || ""}
                                        onChange={handleChange}
                                        placeholder="Enter transaction code"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className={labelClasses}>Jurisdiction (Mainland/Freezone)</label>
                                <div className="relative z-20 bg-transparent">
                                    <select
                                        title="Select jurisdiction"
                                        value={selectedOption || companyData?.isMainland || ""}
                                        name="isMainland"
                                        onChange={(e) => {
                                            setSelectedOption(e.target.value);
                                            setCompanyData({ ...companyData, isMainland: e.target.value })
                                        }}
                                        className={clsx(
                                            inputClasses,
                                            "appearance-none",
                                            !isOptionSelected && "text-slate-400 dark:text-slate-500"
                                        )}
                                    >
                                        <option value="" disabled>Select jurisdiction type...</option>
                                        <option value="mainland" className="text-slate-800 dark:text-slate-200">Mainland</option>
                                        <option value="freezone" className="text-slate-800 dark:text-slate-200">Freezone</option>
                                    </select>
                                    <span className="absolute right-4 top-1/2 z-30 -translate-y-1/2 text-slate-500">
                                        <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="" />
                                        </svg>
                                    </span>
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className={labelClasses}>Remarks / Notes</label>
                                <textarea
                                    rows={4}
                                    name="remarks"
                                    placeholder="Enter any additional details here..."
                                    value={companyData?.remarks || ""}
                                    onChange={handleChange}
                                    className={clsx(inputClasses, "resize-none")}
                                ></textarea>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
                                <Link 
                                    href={isEditMode ? `/company/${edit}` : "/company"} 
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
                            {(!companyData?.password || companyData?.password.length === 0) && (
                                <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                                    No platform passwords added yet.
                                </div>
                            )}

                            {companyData?.password?.map((item: any, index: number) => (
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
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Platform</label>
                                        <select
                                            title="Select platform"
                                            value={item?.credentialTemplate || ""}
                                            onChange={(e) => handlePasswordChange(index, 'credentialTemplate', e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                        >
                                            <option value="" disabled>Select platform</option>
                                            {credentialTemplateOptions.map((option) => (
                                                <option key={option.id} value={option.id}>{option.platform}</option>
                                            ))}
                                        </select>
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
                                    <div className="mt-4">
                                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</label>
                                        <textarea
                                            rows={3}
                                            value={item?.notes || ""}
                                            onChange={(e) => handlePasswordChange(index, 'notes', e.target.value)}
                                            placeholder="Optional notes"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                        />
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
                                    Company Documents
                                </h3>
                            </div>
                        </div>
                        <div className="px-6 py-6 sm:p-8">
                            {(!companyData?.documents || companyData?.documents.length === 0) && (
                                <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                                    No documents attached yet.
                                </div>
                            )}

                            {companyData?.documents?.map((doc: any, index: number) => (
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
                                            Document Name <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            title="Select document template"
                                            required
                                            value={doc?.documentTemplate || ""}
                                            onChange={(e) => handleDocumentChange(index, 'documentTemplate', e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-emerald-500"
                                        >
                                            <option value="" disabled>Select document</option>
                                            {documentTemplateOptions.map((option) => (
                                                <option key={option.id} value={option.id}>{option.name}</option>
                                            ))}
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
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddCompany;
