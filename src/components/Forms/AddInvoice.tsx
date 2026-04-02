"use client"
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiChevronDown, FiPlus, FiTrash2, FiFileText, FiHash, FiUser, FiMapPin, FiCalendar, FiDollarSign } from "react-icons/fi";
import clsx from "clsx";

const AddInvoice = ({ edit }: { edit?: string | string[] }) => {
    const router = useRouter()
    const { user } = useUserContext();

    const [isEditMode, setisEditMode] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>({
        createdBy: user?._id,
        date: new Date().toISOString().split('T')[0],
        invoiceNo: 1,
        quotation: "false",
        showBalance: "show",
        items: []
    });

    const fetchData = async () => {
        try {
            if (edit) {
                const { data } = await axios.get(`/api/invoice/${edit}?editmode`);
                setInvoiceData(data);
                setisEditMode(true)
            } else {
                const { data } = await axios.get(`/api/invoice/prev`);
                setInvoiceData({ ...invoiceData, title: data?.title, invoiceNo: +data?.invoiceNo + 1, suffix: data?.suffix })
            }
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        fetchData()
    }, [])

    const handleSubmit = async (e: any) => {
        e.preventDefault()
        try {
            if (isEditMode) {
                await axios.put(`/api/invoice/${edit}`, invoiceData);
                router.push(`/accounts/invoice/${edit}`);
            }
            else {
                await axios.post("/api/invoice", invoiceData);
                router.push(`/accounts/invoice`);
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
        const newItem = { quantity: 1, rate: 0, title: "", desc: "" };
        if (!invoiceData.items) {
            setInvoiceData({ ...invoiceData, items: [newItem] })
        }
        else {
            setInvoiceData({ ...invoiceData, items: [...invoiceData.items, newItem] });
        }
    };

    const handleDocumentChange = (index: number, field: string, value: string | Date | number) => {
        const updateditems = [...invoiceData.items];
        updateditems[index][field] = field === 'rate' || field === 'quantity' ? Number(value) : value;
        setInvoiceData({ ...invoiceData, items: updateditems });
    };

    const handleChange = (e: any) => {
        setInvoiceData({
            ...invoiceData,
            [e.target.name]: e.target.value
        })
    }

    const breadCrumb = isEditMode ? "Edit Invoice" : "Create Invoice"
    
    // UI Helpers
    const inputClass = "w-full appearance-none rounded-2xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900";
    const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";

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
                                                placeholder="Enter client name"
                                                className={clsx(inputClass, "pl-11")}
                                            />
                                        </div>
                                    </div>
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
