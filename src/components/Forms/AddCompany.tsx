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
import ColorPicker from "./ColorPicker";

const AddCompany = ({ edit }: { edit?: string | string[] }) => {
    const router = useRouter()
    const queryClient = useQueryClient();
    const editId = Array.isArray(edit) ? edit[0] : edit;
    const hasEditId = typeof editId === "string" && editId.trim().length > 0;
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
        queryKey: ["company", editId], queryFn: async () => {
            const { data } = await axios.get(`/api/company/${editId}`);
            return (data.data);
        },
        enabled: hasEditId
    });

    useEffect(() => {
        if (companyData.isMainland) {
            setIsOptionSelected(true);
        }
    }, [companyData?.isMainland])

    useEffect(() => {
        setisEditMode(hasEditId)

        if (hasEditId && data) {
            setCompanyData(data || { name: "", documents: [], password: [] })
        }
    }, [hasEditId, data])

    useEffect(() => {
        void fetchTemplateLists();
    }, [fetchTemplateLists]);

    const mutation = useMutation(
        {
            mutationFn: async (companyData) => {
                if (isEditMode) {
                    await axios.put(`/api/company/${editId}`, companyData);
                } else {
                    await axios.post("/api/company", companyData);
                }
            },
            onMutate: () => {
                toast.loading("Saving company details...");
            },
            onSuccess: () => {
                if (isEditMode) {
                    router.replace(`/company/${editId}`);
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

    const inputClasses = "w-full rounded-2xl border border-slate-300/90 bg-white/95 px-5 py-3 text-slate-900 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20";
    const labelClasses = "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Breadcrumb pageName={breadCrumb} />

            <div className="relative mb-6 overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />
                <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />
                <p className="relative inline-flex items-center rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-900/30 dark:text-cyan-300">
                    Company Setup
                </p>
                <h2 className="relative mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {isEditMode ? "Update Company Profile" : "Create Company Profile"}
                </h2>
                <p className="relative mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Add company profile details in one organized workflow.
                </p>
            </div>

            <form className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-12" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-8 xl:col-span-12">
                    {/* Company Details Card */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
                        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
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

                            <ColorPicker
                                selectedColor={companyData?.color}
                                onChange={(color) => setCompanyData({ ...companyData, color })}
                            />

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
                                    href={isEditMode ? `/company/${editId}` : "/company"} 
                                    className="flex w-full sm:w-auto justify-center rounded-2xl border border-slate-300 bg-white px-8 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 md:order-1"
                                >
                                    Cancel
                                </Link>
                                <button 
                                    type="submit" 
                                    className="flex w-full sm:w-auto justify-center rounded-2xl bg-cyan-600 px-8 py-3.5 font-semibold text-white transition hover:bg-cyan-700 shadow-sm shadow-cyan-600/30 md:order-2"
                                >
                                    {confirmBtn}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default AddCompany;
