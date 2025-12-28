"use client";

import * as React from "react";
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/utils/cn";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colorClasses = {
  success: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
  error: "bg-red/10 border-red/20 dark:bg-red/20 dark:border-red/30",
  warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
  info: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
};

const iconColorClasses = {
  success: "text-emerald-600 dark:text-emerald-400",
  error: "text-red",
  warning: "text-yellow-600 dark:text-yellow-400",
  info: "text-blue-600 dark:text-blue-400",
};

function ToastComponent({ id, type, title, message, onClose }: ToastProps) {
  const Icon = icons[type];

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm animate-slide-in min-w-[320px] max-w-md",
        colorClasses[type]
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColorClasses[type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-black dark:text-white">{title}</p>
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Expose toast functions globally
  React.useEffect(() => {
    (window as any).toast = {
      success: (title: string, message?: string) => addToast({ type: "success", title, message }),
      error: (title: string, message?: string) => addToast({ type: "error", title, message }),
      warning: (title: string, message?: string) => addToast({ type: "warning", title, message }),
      info: (title: string, message?: string) => addToast({ type: "info", title, message }),
    };
  }, [addToast]);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </>
  );
}

// TypeScript declaration for global toast
declare global {
  interface Window {
    toast: {
      success: (title: string, message?: string) => void;
      error: (title: string, message?: string) => void;
      warning: (title: string, message?: string) => void;
      info: (title: string, message?: string) => void;
    };
  }
}
