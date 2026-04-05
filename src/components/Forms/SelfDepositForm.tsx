"use client";

import { useUserContext } from '@/contexts/UserContext';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import PaymentMethodBadge from '../common/PaymentMethodBadge';
import toast from 'react-hot-toast';

type TData = {
    from: string,
    to: string;
    amount: string,
    createdBy?: string
}

const SelfDepositForm = () => {
    const { user } = useUserContext();
    const queryClient = useQueryClient();
    const [paymentMethods, setPaymentMethods] = useState<Array<{ value: string; label: string; color?: string; icon?: string }>>([]);
    const initData = {
        from: "",
        to: "",
        amount: "",
        createdBy: user?._id,
    }
    const [data, setData] = useState<TData>({
        ...initData,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fromMethod = paymentMethods.find((method) => method.value === data.from);
    const toMethod = paymentMethods.find((method) => method.value === data.to);
    const isSameMethod = Boolean(data.from && data.to && data.from === data.to);

    useEffect(() => {
        void axios
            .get('/api/templates', { params: { type: 'payment' } })
            .then((response) => {
                const options = (response.data?.options || []).map((item: any) => ({
                    value: item.method,
                    label: item.label || item.method,
                    color: item.color,
                    icon: item.icon,
                }));
                setPaymentMethods(options);
                if (options.length > 0) {
                    setData((prev) => ({
                        ...prev,
                        from: prev.from || options[0].value,
                        to: prev.to || (options[1]?.value || options[0].value),
                    }));
                }
            })
            .catch((error) => {
                console.error('Error fetching payment method templates:', error);
            });
    }, []);

    const resetForm = () => {
        setData(initData);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        switch (true) {
            case +data.amount < 1:
                toast.error("The amount should not be 0 or less");
                return;
            case data.from === data.to:
                toast.error("Please select different from and to methods");
                return;
            default:
                break;
        }
        try {
            setIsSubmitting(true);
            await axios.post("/api/payment/swap", data);
            toast.success("Transfer completed successfully");
            resetForm();
            queryClient.invalidateQueries({ queryKey: ["self-deposit-transfers"] });
        } catch (error: any) {
            console.log(error);
            toast.error(error?.response?.data?.message || "Transfer failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg dark:border-slate-700/50 dark:from-slate-800 dark:to-slate-900">
            <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10 px-6 py-5 dark:border-slate-700/50">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <FiRefreshCw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Create Transfer</h3>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Move balance between payment methods instantly</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Transfer Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-500 dark:text-slate-400">AED</span>
                        <input
                            type="number"
                            name="amount"
                            value={data.amount}
                            onWheel={(e: any) => e.target.blur()}
                            onChange={(e) => {
                                setData({ ...data, amount: e.target.value });
                            }}
                            placeholder="0.00"
                            className="w-full border border-slate-300 bg-white pl-14 pr-4 py-3 text-2xl font-black text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-xl dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:ring-emerald-500/20"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-[1fr_auto_1fr]">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">From Account</label>
                        <select
                            value={data.from}
                            name="from"
                            onChange={(e) => {
                                setData({ ...data, from: e.target.value });
                            }}
                            className="w-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:ring-emerald-500/20"
                        >
                            {paymentMethods.length === 0 && <option value="">No methods</option>}
                            {paymentMethods.map((method) => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                        {data.from && (
                            <div className="mt-2">
                                <PaymentMethodBadge
                                    label={fromMethod?.label || data.from}
                                    color={fromMethod?.color}
                                    icon={fromMethod?.icon}
                                    size="sm"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-end justify-center pb-1 md:pb-0">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <FiArrowRight className="h-5 w-5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">To Account</label>
                        <select
                            value={data.to}
                            name="to"
                            onChange={(e) => {
                                setData({ ...data, to: e.target.value });
                            }}
                            className="w-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-lg dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:ring-emerald-500/20"
                        >
                            {paymentMethods.length === 0 && <option value="">No methods</option>}
                            {paymentMethods.map((method) => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                        {data.to && (
                            <div className="mt-2">
                                <PaymentMethodBadge
                                    label={toMethod?.label || data.to}
                                    color={toMethod?.color}
                                    icon={toMethod?.icon}
                                    size="sm"
                                />
                            </div>
                        )}
                        {isSameMethod && (
                            <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                From and to methods must be different.
                            </p>
                        )}
                    </div>
                </div>

                {data.from && data.to && data.amount && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                <span className="font-semibold">{formatAmount(+data.amount)}</span>
                                {' will be transferred from '}
                                <span className="font-bold text-slate-900 dark:text-slate-100">{fromMethod?.label}</span>
                                {' to '}
                                <span className="font-bold text-slate-900 dark:text-slate-100">{toMethod?.label}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !data.amount || !data.from || !data.to || isSameMethod}
                        className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:from-emerald-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm Transfer'}
                    </button>
                </div>
            </form>
        </div>
    );
};

function formatAmount(value: number) {
  return `${Number(value || 0).toFixed(2)} AED`;
}

export default SelfDepositForm;
