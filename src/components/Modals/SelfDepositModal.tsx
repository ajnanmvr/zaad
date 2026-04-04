import { useUserContext } from '@/contexts/UserContext';
import axios from 'axios';
import React, { useState } from 'react';
import { FiArrowRight, FiRefreshCw, FiX } from 'react-icons/fi';

type TData = {
    from: string,
    to: string;
    amount: string,
    createdBy?: string
}

const SelfDepositModal = ({ isOpen, cancel }: {
    isOpen: boolean;
    cancel: () => void;
}) => {
    const { user } = useUserContext();
    const initData = {
        from: "cash",
        to: "bank",
        amount: "",
        createdBy: user?._id,
    }
    const [data, setData] = useState<TData>({
        ...initData,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const paymentMethods = [
        { value: 'bank', label: 'Bank' },
        { value: 'cash', label: 'Cash' },
        { value: 'tasdeed', label: 'Tasdeed' },
        { value: 'swiper', label: 'Swiper' },
    ];

    const resetAndClose = () => {
        setData(initData);
        cancel();
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        switch (true) {
            case +data.amount < 1:
                alert("The amount should not be 0 or less");
                return;
            case data.from === data.to:
                alert("Please select different from and to methods");
                return;
            default:
                break;
        }
        try {
            setIsSubmitting(true);
            await axios.post("/api/payment/swap", data);
            resetAndClose();
        } catch (error) {
            console.log(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return isOpen ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/20 dark:border-slate-800 dark:bg-slate-900">
                <div className="relative border-b border-slate-200/80 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
                    <button
                        type="button"
                        onClick={resetAndClose}
                        className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-white/80 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <FiX />
                    </button>
                    <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <FiRefreshCw /> Internal Transfer
                    </p>
                    <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Self Deposit</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Move balance from one payment method to another without creating external client transactions.</p>
                </div>

                <div className="space-y-6 p-6">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount (AED)</label>
                        <input
                            type="number"
                            name="amount"
                            value={data.amount}
                            onWheel={(e: any) => e.target.blur()}
                            onChange={(e) => {
                                setData({ ...data, amount: e.target.value });
                            }}
                            placeholder="0"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-center text-4xl font-black tracking-tight text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">From</label>
                            <select
                                value={data.from}
                                name="from"
                                onChange={(e) => {
                                    setData({ ...data, from: e.target.value });
                                }}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                {paymentMethods.map((method) => (
                                    <option key={method.value} value={method.value}>
                                        {method.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-center pb-1 text-emerald-600 dark:text-emerald-400">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider dark:border-emerald-900/40 dark:bg-emerald-500/10">
                                Move <FiArrowRight />
                            </span>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">To</label>
                            <select
                                value={data.to}
                                name="to"
                                onChange={(e) => {
                                    setData({ ...data, to: e.target.value });
                                }}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                                {paymentMethods.map((method) => (
                                    <option key={method.value} value={method.value}>
                                        {method.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                        Transfer summary: <span className="font-semibold capitalize">{data.from}</span> to <span className="font-semibold capitalize">{data.to}</span>
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={resetAndClose}
                            className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Transfer'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    ) : null;
};

export default SelfDepositModal;
