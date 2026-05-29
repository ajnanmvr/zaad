"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";
import { TBaseData } from "@/types/types";
import axios from "axios";
import { debounce } from "lodash";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FiChevronDown, FiPlus, FiTrash2, FiFileText, FiHash, FiUser, FiMapPin, FiCalendar, FiDollarSign } from "react-icons/fi";
import clsx from "clsx";
import EntityAvatar from "../common/EntityAvatar";
import toast from "react-hot-toast";
import { hasPermission } from "@/auth/permissions";

const INVOICE_PREFILL_STORAGE_KEY = "zaad.invoice.prefill";
const INVOICE_PREFILL_MAX_AGE_MS = 30 * 60 * 1000;

type InvoicePrefillPayload = {
    connectionMode?: "detached" | "connected";
    selectedEntityType?: "company" | "employee" | "individual" | null;
    selectedEntitySummary?: {
        id: string;
        name: string;
        color?: string;
        type: "company" | "employee" | "individual";
    } | null;
    invoiceData?: Record<string, any>;
    createdAt?: number;
};

const AddInvoice = ({ edit }: { edit?: string | string[] }) => {
    const router = useRouter()
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("returnTo");
    const prefillSource = searchParams.get("prefill");
    const { user } = useUserContext();
    const isEditRoute = Boolean(edit);
    const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
    const canCreateInvoice = hasPermission(permissions, "payments.create.invoices");
    const canUpdateInvoice = hasPermission(permissions, "payments.update.invoices");

    const [isEditMode, setisEditMode] = useState(false);
    const [connectionMode, setConnectionMode] = useState<"detached" | "connected">("connected");
    const [selectedEntityType, setSelectedEntityType] = useState<"company" | "employee" | "individual" | "">("");
    const [entitySearchValue, setEntitySearchValue] = useState("");
    const [entitySuggestions, setEntitySuggestions] = useState<TBaseData[]>([]);
    const [selectedEntitySummary, setSelectedEntitySummary] = useState<{
        id: string;
        name: string;
        color?: string;
        type: "company" | "employee" | "individual";
    } | null>(null);
    const [invoiceData, setInvoiceData] = useState<any>({
        createdBy: user?._id,
        date: new Date().toISOString().split('T')[0],
        invoiceNo: 1,
        quotation: "false",
        showBalance: "show",
        entityId: null,
        entityType: null,
        items: []
    });

    const fetchEntitySuggestions = async (inputValue: string, type: string) => {
        try {
            if (!inputValue || !type) {
                setEntitySuggestions([]);
                return;
            }
            const response = await axios.get<TBaseData[]>(`/api/${type}/search/${inputValue}`);
            setEntitySuggestions(response.data || []);
        } catch (error) {
            console.error("Error fetching entity suggestions:", error);
            setEntitySuggestions([]);
        }
    };

    const debouncedEntitySearch = debounce((input: string, type: string) => {
        fetchEntitySuggestions(input, type);
    }, 300);

    const fetchData = useCallback(async () => {
        try {
            if (edit) {
                const { data } = await axios.get(`/api/invoice/${edit}?editmode`);
                setInvoiceData(data);
                if (data?.entityId && data?.entityType) {
                    setConnectionMode("connected");
                    setSelectedEntityType(data.entityType);
                    setEntitySearchValue(data.client || "");
                    setSelectedEntitySummary({
                        id: data.entityId,
                        name: data.client || "Selected Entity",
                        type: data.entityType,
                    });
                } else {
                    setConnectionMode("detached");
                    setSelectedEntityType("");
                    setEntitySearchValue("");
                    setSelectedEntitySummary(null);
                }
                setisEditMode(true)
            } else {
                const { data } = await axios.get(`/api/invoice/prev`);
                const baseInvoiceData = {
                    title: data?.title,
                    invoiceNo: +data?.invoiceNo + 1,
                    suffix: data?.suffix,
                };

                let nextInvoiceData: Record<string, any> = baseInvoiceData;

                if (prefillSource === "records") {
                    try {
                        const rawPrefill = sessionStorage.getItem(INVOICE_PREFILL_STORAGE_KEY);
                        if (rawPrefill) {
                            const parsed: InvoicePrefillPayload = JSON.parse(rawPrefill);
                            const createdAt = Number(parsed?.createdAt || 0);
                            const isFresh = createdAt > 0 && Date.now() - createdAt <= INVOICE_PREFILL_MAX_AGE_MS;

                            if (isFresh && parsed?.invoiceData) {
                                nextInvoiceData = {
                                    ...baseInvoiceData,
                                    ...parsed.invoiceData,
                                };

                                if (parsed.connectionMode === "connected" && parsed.selectedEntityType) {
                                    setConnectionMode("connected");
                                    setSelectedEntityType(parsed.selectedEntityType);
                                    setSelectedEntitySummary(parsed.selectedEntitySummary || null);
                                    setEntitySearchValue(String(parsed.invoiceData.client || ""));
                                } else {
                                    setConnectionMode("detached");
                                    setSelectedEntityType("");
                                    setSelectedEntitySummary(null);
                                    setEntitySearchValue(String(parsed.invoiceData.client || ""));
                                }

                                toast.success("Invoice form auto-filled from selected records");
                            }

                            sessionStorage.removeItem(INVOICE_PREFILL_STORAGE_KEY);
                        }
                    } catch (prefillError) {
                        sessionStorage.removeItem(INVOICE_PREFILL_STORAGE_KEY);
                        console.error("Failed to parse invoice prefill payload:", prefillError);
                    }
                }

                setInvoiceData((prev: any) => ({ ...prev, ...nextInvoiceData }));
            }
        } catch (error) {
            console.log(error);
        }
    }, [edit, prefillSource]);
    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        if (!user) {
            return;
        }

        const canAccess = isEditRoute ? canUpdateInvoice : canCreateInvoice;
        if (!canAccess) {
            router.push("/");
        }
    }, [user, isEditRoute, canCreateInvoice, canUpdateInvoice, router]);

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        const canSubmit = isEditRoute ? canUpdateInvoice : canCreateInvoice;
        if (!canSubmit) {
            toast.error("You do not have permission to submit invoices.");
            return;
        }

        try {
            if (connectionMode === "connected" && (!invoiceData?.entityId || !invoiceData?.entityType)) {
                toast.error("Please select an entity to connect this invoice.");
                return;
            }

            const normalizedItems = Array.isArray(invoiceData?.items)
                ? invoiceData.items.map((item: any) => ({
                    ...item,
                    rate: Number(item?.rate || 0),
                    quantity: Number(item?.quantity || 0),
                }))
                : [];

            const normalizedInvoiceData = {
                ...invoiceData,
                items: normalizedItems,
            };

            const payload = connectionMode === "connected"
                ? normalizedInvoiceData
                : { ...normalizedInvoiceData, entityId: null, entityType: null };

            if (isEditMode) {
                await axios.put(`/api/invoice/${edit}`, payload);
                router.push(`/accounts/invoice/${edit}`);
            }
            else {
                await axios.post("/api/invoice", payload);
                const redirectPath = returnTo 
                    ? decodeURIComponent(returnTo)
                    : `/accounts/invoice`;
                router.push(redirectPath);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleDeleteDocument = (index: number) => {
        const updatedItems = invoiceData.items.filter((item: any, itemIndex: number) => itemIndex !== index);
        setInvoiceData({ ...invoiceData, items: updatedItems });
    };

    const handleAddDocument = (e: any) => {
        e.preventDefault()
        const newItem = { quantity: "", rate: "", title: "", desc: "" };
        if (!invoiceData.items) {
            setInvoiceData({ ...invoiceData, items: [newItem] })
        }
        else {
            setInvoiceData({ ...invoiceData, items: [...invoiceData.items, newItem] });
        }
    };

    const handleDocumentChange = (index: number, field: string, value: string | Date | number) => {
        const updateditems = [...invoiceData.items];
        if (field === 'rate' || field === 'quantity') {
            if (value === "") {
                updateditems[index][field] = "";
            } else {
                updateditems[index][field] = Number(value);
            }
        } else {
            updateditems[index][field] = value;
        }
        setInvoiceData({ ...invoiceData, items: updateditems });
    };

    const handleChange = (e: any) => {
        setInvoiceData({
            ...invoiceData,
            [e.target.name]: e.target.value
        })
    }

    const handleEntitySearchChange = (e: any) => {
        const value = e.target.value;
        setEntitySearchValue(value);
        setSelectedEntitySummary(null);
        setInvoiceData((prev: any) => ({ ...prev, client: value, entityId: null }));
        if (selectedEntityType) {
            debouncedEntitySearch(value, selectedEntityType);
        }
    };

    const handleEntitySelection = (selected: TBaseData) => {
        if (!selected._id) {
            return;
        }
        setEntitySearchValue(selected.name);
        if (selectedEntityType) {
            setSelectedEntitySummary({
                id: selected._id,
                name: selected.name,
                color: selected.color,
                type: selectedEntityType,
            });
        }
        setInvoiceData((prev: any) => ({
            ...prev,
            client: selected.name,
            entityId: selected._id,
            entityType: selectedEntityType,
        }));
        setEntitySuggestions([]);
    };

    const breadCrumb = isEditMode ? "Edit Invoice" : "Create Invoice"
    
    // UI Helpers
    const inputClass = "w-full appearance-none rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900";
    const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

    if (!user || (isEditRoute ? !canUpdateInvoice : !canCreateInvoice)) {
        return (
            <div className="flex min-h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumb pageName={`${breadCrumb}`} />
            
            <form className="relative" onSubmit={handleSubmit}>
                <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-none">
                    <div className="relative overflow-hidden border-b border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-6 dark:border-violet-900/30 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20 sm:p-7">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-16 -left-14 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />

                        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/60 bg-violet-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-700 dark:border-violet-700/40 dark:bg-violet-900/30 dark:text-violet-300">
                                    <FiFileText />
                                    Billing Composer
                                </p>
                                <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                                    {isEditMode ? "Edit Invoice" : "Create Invoice"}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Build a polished invoice with structured details, line items, and settings.
                                </p>
                            </div>

                            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                                <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                                {isEditMode ? "Edit Mode" : "Draft Mode"}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-7">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* Left Column: Core Invoice Details */}
                    <div className="xl:col-span-2 space-y-6">
                        
                        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5 rounded-t-3xl dark:border-slate-800 dark:bg-slate-800/40">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <FiFileText className="text-emerald-500" /> Primary Details
                                </h3>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Invoice Title <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={invoiceData?.title || ''}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. Professional Services"
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Purpose <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            name="purpose"
                                            value={invoiceData?.purpose || ''}
                                            onChange={handleChange}
                                            placeholder="e.g. Website Development"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                                        <div>
                                            <label className={labelClass}>Client Type</label>
                                            <div className="relative">
                                                <select
                                                    value={connectionMode === "detached" ? "detached" : selectedEntityType}
                                                    onChange={(e) => {
                                                        const value = e.target.value as "detached" | "company" | "employee" | "individual";

                                                        if (value === "detached") {
                                                            setConnectionMode("detached");
                                                            setSelectedEntityType("");
                                                            setEntitySearchValue("");
                                                            setSelectedEntitySummary(null);
                                                            setEntitySuggestions([]);
                                                            setInvoiceData((prev: any) => ({
                                                                ...prev,
                                                                entityId: null,
                                                                entityType: null,
                                                            }));
                                                            return;
                                                        }

                                                        setConnectionMode("connected");
                                                        setSelectedEntityType(value);
                                                        setEntitySearchValue("");
                                                        setSelectedEntitySummary(null);
                                                        setEntitySuggestions([]);
                                                        setInvoiceData((prev: any) => ({
                                                            ...prev,
                                                            entityId: null,
                                                            entityType: value,
                                                            client: "",
                                                        }));
                                                    }}
                                                    className={inputClass}
                                                >
                                                    <option value="" disabled>Select client type</option>
                                                    <option value="employee">Employee</option>
                                                    <option value="company">Company</option>
                                                    <option value="individual">Individual</option>
                                                    <option value="detached">Detached</option>
                                                </select>
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                    <FiChevronDown />
                                                </span>
                                            </div>
                                        </div>

                                        {connectionMode === "detached" && (
                                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                                                Warning: This invoice is detached and will not be linked to any entity profile.
                                            </div>
                                        )}

                                        {connectionMode === "connected" && (
                                            <div className="mt-4">
                                                <label className={labelClass}>Select Entity</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={entitySearchValue}
                                                        onChange={handleEntitySearchChange}
                                                        placeholder="Search and select an entity"
                                                        className={inputClass}
                                                    />
                                                    {entitySuggestions.length > 0 && (
                                                        <ul className="absolute z-20 mt-2 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                                                            {entitySuggestions.map((suggestion) => (
                                                                <li
                                                                    key={suggestion._id}
                                                                    onClick={() => handleEntitySelection(suggestion)}
                                                                    className="cursor-pointer px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <EntityAvatar name={suggestion.name} color={suggestion.color} size="sm" />
                                                                        <div className="flex flex-col">
                                                                            <span className="font-medium text-slate-800 dark:text-slate-100">{suggestion.name}</span>
                                                                            <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                                                {selectedEntityType}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                {selectedEntitySummary && invoiceData?.entityId && (
                                                    <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-900/10">
                                                        <EntityAvatar name={selectedEntitySummary.name} color={selectedEntitySummary.color} size="sm" />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedEntitySummary.name}</p>
                                                            <p className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{selectedEntitySummary.type}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelClass}>Client Name</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <FiUser />
                                            </span>
                                            <input
                                                type="text"
                                                name="client"
                                                onChange={handleChange}
                                                value={invoiceData?.client || ''}
                                                disabled={connectionMode === "connected"}
                                                placeholder="Enter client name"
                                                className={clsx(inputClass, "pl-11")}
                                            />
                                        </div>
                                    </div>
                                    {connectionMode === "detached" && (
                                        <div>
                                            <label className={labelClass}>Location</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <FiMapPin />
                                                </span>
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={invoiceData?.location || ''}
                                                    onChange={handleChange}
                                                    placeholder="Enter client location"
                                                    className={clsx(inputClass, "pl-11")}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>TRN Number</label>
                                        <input
                                            type="text"
                                            name="trn"
                                            value={invoiceData?.trn || ''}
                                            onChange={handleChange}
                                            placeholder="Client TRN"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5 rounded-t-3xl dark:border-slate-800 dark:bg-slate-800/40 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-white">
                                    Line Items
                                </h3>
                                <button 
                                    type="button"
                                    onClick={handleAddDocument} 
                                    className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                                >
                                    <FiPlus /> Add Item
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {invoiceData?.items?.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                        No items added yet. Click &quot;Add Item&quot; to begin.
                                    </div>
                                )}
                                
                                {invoiceData?.items?.map((doc: any, index: number) => (
                                    <div key={index} className="relative rounded-2xl border border-slate-200 bg-slate-50/40 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); handleDeleteDocument(index) }}
                                            className="absolute right-4 top-4 rounded-lg bg-rose-50 p-2 text-rose-500 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
                                            title="Remove Item"
                                        >
                                            <FiTrash2 />
                                        </button>
                                        
                                        <div className="space-y-4 pr-12">
                                            <div>
                                                <label className={labelClass}>Item Title <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={doc?.title || ''}
                                                    onChange={(e) => handleDocumentChange(index, 'title', e.target.value)}
                                                    placeholder="Product or service name"
                                                    className={clsx(inputClass, "bg-white dark:bg-slate-900")}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Description</label>
                                                <textarea
                                                    rows={2}
                                                    placeholder="Detailed description..."
                                                    value={doc?.desc || ''}
                                                    onChange={(e) => handleDocumentChange(index, 'desc', e.target.value)}
                                                    className={clsx(inputClass, "resize-y bg-white dark:bg-slate-900")}
                                                ></textarea>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>Rate (AED)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={doc?.rate !== undefined ? doc.rate : ''}
                                                        onWheel={(e: any) => e.target.blur()}
                                                        onChange={(e) => handleDocumentChange(index, 'rate', e.target.value)}
                                                        placeholder="0.00"
                                                        className={clsx(inputClass, "bg-white dark:bg-slate-900")}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Quantity</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        min="1"
                                                        value={doc?.quantity !== undefined ? doc.quantity : ''}
                                                        onWheel={(e: any) => e.target.blur()}
                                                        onChange={(e) => handleDocumentChange(index, 'quantity', e.target.value)}
                                                        placeholder="1"
                                                        className={clsx(inputClass, "bg-white dark:bg-slate-900")}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Settings & Meta */}
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5 rounded-t-3xl dark:border-slate-800 dark:bg-slate-800/40">
                                <h3 className="font-bold text-slate-800 dark:text-white">
                                    Invoice Settings
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className={labelClass}>Invoice Type</label>
                                    <div className="relative">
                                        <select
                                            value={invoiceData.quotation}
                                            name="quotation"
                                            onChange={handleChange}
                                            className={inputClass}
                                        >
                                            <option value="false">Standard Invoice</option>
                                            <option value="true">Quotation</option>
                                        </select>
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <FiChevronDown />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Balance Display</label>
                                    <div className="relative">
                                        <select
                                            value={invoiceData.showBalance}
                                            name="showBalance"
                                            onChange={handleChange}
                                            className={inputClass}
                                        >
                                            <option value="show">Show Balance</option>
                                            <option value="hide">Hide Balance</option>
                                        </select>
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                            <FiChevronDown />
                                        </span>
                                    </div>
                                </div>

                                <hr className="border-slate-200 dark:border-slate-800" />

                                <div>
                                    <label className={labelClass}>Invoice Suffix</label>
                                    <input
                                        type="text"
                                        name="suffix"
                                        value={invoiceData?.suffix || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. INV-"
                                        className={clsx(inputClass, "uppercase")}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Invoice Number</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <FiHash />
                                        </span>
                                        <input
                                            type="number"
                                            name="invoiceNo"
                                            onWheel={(e: any) => e.target.blur()}
                                            value={invoiceData?.invoiceNo || ''}
                                            onChange={handleChange}
                                            placeholder="0001"
                                            className={clsx(inputClass, "pl-11")}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Date Issued</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="date"
                                            value={invoiceData?.date || ''}
                                            onChange={handleChange}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                
                                {invoiceData.quotation === "false" && (
                                    <div>
                                        <label className={labelClass}>Advance Payment</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                <FiDollarSign />
                                            </span>
                                            <input
                                                type="number"
                                                name="advance"
                                                value={invoiceData?.advance || ''}
                                                onWheel={(e: any) => e.target.blur()}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                className={clsx(inputClass, "pl-11")}
                                            />
                                        </div>
                                    </div>
                                )}

                                {invoiceData.quotation === "true" && (
                                    <>
                                        <div>
                                            <label className={labelClass}>Valid Until</label>
                                            <input 
                                                type="date"
                                                name="validTo"
                                                value={invoiceData?.validTo || ''}
                                                onChange={handleChange}
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Quotation Message</label>
                                            <textarea
                                                rows={3}
                                                name="message"
                                                placeholder="Message to the client..."
                                                value={invoiceData?.message || ''}
                                                onChange={handleChange}
                                                className={clsx(inputClass, "resize-y")}
                                            ></textarea>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className={labelClass}>Remarks / Notes</label>
                                    <textarea
                                        rows={4}
                                        name="remarks"
                                        placeholder="Internal notes..."
                                        value={invoiceData?.remarks || ''}
                                        onChange={handleChange}
                                        className={clsx(inputClass, "resize-y")}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 space-y-3 xl:sticky xl:top-6">
                            <button 
                                type="submit" 
                                className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                                {isEditMode ? "Save Changes" : "Publish Invoice"}
                            </button>
                            <Link 
                                href="/accounts/invoice" 
                                className="flex w-full justify-center rounded-xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>

                </div>
                </div>
                </div>
            </form>
        </div>
    );
};

export default AddInvoice;
