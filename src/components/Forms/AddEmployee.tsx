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
import ColorPicker from "./ColorPicker";
import EntityAvatar from "../common/EntityAvatar";

const AddEmployee = ({
    company,
    edit,
    individualMode = false,
}: {
    company?: string | string[];
    edit?: string | string[];
    individualMode?: boolean;
}) => {
    const router = useRouter()
    const queryClient = useQueryClient();
    const editId = Array.isArray(edit) ? edit[0] : edit;
    const hasEditId = typeof editId === "string" && editId.trim().length > 0;
    const entityApiBase = individualMode ? "/api/individual" : "/api/employee";
    const [searchSuggestions, setSearchSuggestions] = useState<TBaseData[]>([]);
    const [searchValue, setSearchValue] = useState<string>("");
    const [selectedCompanySummary, setSelectedCompanySummary] = useState<{
        id: string;
        name: string;
        color?: string;
    } | null>(null);
    const [isEditMode, setisEditMode] = useState(false);
    const [employeeData, setEmployeeData] = useState<any>({
        name: "", company: "", documents: [], password: []
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

    useEffect(() => {
        if (company) {
            const companyId = Array.isArray(company) ? company[0] : company;
            setEmployeeData((prev: any) => ({ ...prev, company: companyId }))
            setSelectedCompanySummary({
                id: companyId,
                name: companyId,
            });
        }
    }, [company])

    const { data } = useQuery<any>({
        queryKey: [individualMode ? "individual" : "employee", editId], queryFn: async () => {
            const { data } = await axios.get(`${entityApiBase}/${editId}`);
            return (data.data);
        },
        enabled: hasEditId
    });

    useEffect(() => {
        setisEditMode(hasEditId)

        if (hasEditId && data) {
            setEmployeeData(data || { name: "", company: "", documents: [], password: [] })
            if (data?.company?.name) {
                setSearchValue(data.company.name)
                setSelectedCompanySummary({
                    id: data.company._id || data.company.id || "",
                    name: data.company.name,
                    color: data.company.color,
                });
            }
        }
    }, [hasEditId, data])

    useEffect(() => {
        void fetchTemplateLists();
    }, [fetchTemplateLists]);

    const mutation = useMutation(
        {
            mutationFn: async (employeeData: Record<string, any>) => {
                const payload = individualMode
                    ? { ...employeeData, entityType: "individual" }
                    : employeeData;

                if (individualMode) {
                    delete payload.company;
                }

                if (isEditMode) {
                    await axios.put(`${entityApiBase}/${editId}`, payload);
                } else {
                    await axios.post("/api/employee", payload);
                }
            },
            onMutate: () => {
                toast.loading(individualMode ? "Saving individual details..." : "Saving employee details...");
            },
            onSuccess: () => {
                if (isEditMode) {
                    router.replace(individualMode ? `/individual/${editId}` : `/employee/${editId}`);
                } else {
                    router.push(individualMode ? "/individual" : "/employee");
                }
                toast.dismiss()
                toast.success(individualMode ? "Individual details saved successfully!" : "Employee details saved successfully!");
                queryClient.invalidateQueries({ queryKey: ["employees"] });
                if (individualMode) {
                    queryClient.invalidateQueries({ queryKey: ["individuals"] });
                }
            },
            onError: () => {
                toast.dismiss()
                toast.error(individualMode ? "Failed to save individual details" : "Failed to save employee details");
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
        setSelectedCompanySummary(null);
        setEmployeeData((prev: any) => ({ ...prev, company: "" }));
        const inputName = e.target.name;
        debounceSearch(e.target.value, inputName);
    };

    const handleCompanySelection = (selected: TBaseData) => {
        if (!selected._id) {
            return;
        }
        setSearchValue(selected.name)
        setSelectedCompanySummary({
            id: selected._id,
            name: selected.name,
            color: selected.color,
        });
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
            if (field === "credentialTemplate") {
                const selectedTemplate = credentialTemplateOptions.find(
                    (template) => template.id === value,
                );
                updatedPasswords[index].platform = selectedTemplate?.platform || "";
            }
            updatedPasswords[index][field] = value;
            setEmployeeData({ ...employeeData, password: updatedPasswords });
        }
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
        if (!employeeData.password) {
            setEmployeeData({ ...employeeData, password: [password] })
        } else {
            const updatedPasswords = [...employeeData.password, password];
            setEmployeeData({ ...employeeData, password: updatedPasswords });
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
            if (field === "documentTemplate") {
                const selectedTemplate = documentTemplateOptions.find(
                    (template) => template.id === value,
                );
                updatedDocuments[index].name = selectedTemplate?.name || "";
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

    const breadCrumb = isEditMode
        ? (individualMode ? "Edit Individual" : "Edit Employee")
        : (individualMode ? "Add Individual" : "Add Employee")
    const confirmBtn = isEditMode
        ? "Save Changes"
        : (individualMode ? "Create Individual" : "Create Employee")
    const cancelLink = isEditMode
        ? (individualMode ? `/individual/${editId}` : `/employee/${editId}`)
        : (individualMode ? "/individual" : "/employee")

    const inputClasses = "w-full rounded-2xl border border-slate-300/90 bg-white/95 px-5 py-3 text-slate-900 outline-none transition-all duration-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800/90 dark:text-white dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20";
    const labelClasses = "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

    return (
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <Breadcrumb pageName={breadCrumb} />

            <div className="relative mb-6 overflow-hidden rounded-3xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-6 shadow-sm dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />
                <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />
                <p className="relative inline-flex items-center rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-900/30 dark:text-cyan-300">
                    {individualMode ? "Individual Setup" : "Employee Setup"}
                </p>
                <h2 className="relative mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {isEditMode
                        ? individualMode
                            ? "Update Individual Profile"
                            : "Update Employee Profile"
                        : individualMode
                            ? "Create Individual Profile"
                            : "Create Employee Profile"}
                </h2>
                <p className="relative mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Configure profile details in one place.
                </p>
            </div>

            <form className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-12" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-8 xl:col-span-12">
                    {/* Employee Details Card */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
                        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center gap-3">
                            <FiUser className="text-xl text-primary" />
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                                {individualMode ? "Individual Details" : "Employee Details"}
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
                                    placeholder={individualMode ? "Enter individual full name" : "Enter employee full name"}
                                    className={inputClasses}
                                />
                            </div>

                            <ColorPicker
                                selectedColor={employeeData?.color}
                                onChange={(color) => setEmployeeData({ ...employeeData, color })}
                            />

                            {!company && !individualMode && (
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
                                                        <div className="flex items-center gap-3">
                                                            <EntityAvatar name={comp.name} color={comp.color} size="sm" />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{comp.name}</span>
                                                                <span className="text-[10px] uppercase tracking-wider text-slate-400">Company</span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {selectedCompanySummary && (
                                        <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                                            <EntityAvatar name={selectedCompanySummary.name} color={selectedCompanySummary.color} size="sm" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedCompanySummary.name}</p>
                                                <p className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Company</p>
                                            </div>
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
                                    placeholder={individualMode ? "individual@email.com" : "employee@company.com"}
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
                                    placeholder={individualMode ? "e.g. Consultant, Freelancer" : "e.g. Software Engineer, Manager"}
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

export default AddEmployee;
