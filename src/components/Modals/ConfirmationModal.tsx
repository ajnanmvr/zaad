import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "primary";
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title = "Please Confirm",
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    isLoading = false,
    onConfirm,
    onCancel,
}) => {
    const confirmButtonClass =
        variant === "warning"
            ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/30"
            : variant === "primary"
                ? "bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500/30"
                : "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/30";

    return isOpen ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClass}`}
                    >
                        {isLoading ? "Processing..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

export default ConfirmationModal;
