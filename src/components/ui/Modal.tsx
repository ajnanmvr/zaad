import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full bg-white dark:bg-boxdark rounded-xl shadow-xl animate-scale-in",
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-6 border-b border-stroke dark:border-strokedark">
            <div className="flex-1">
              {title && (
                <h3 className="text-xl font-semibold text-black dark:text-white">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="-mt-2 -mr-2"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 pt-6 border-t border-stroke dark:border-strokedark -mb-6 pb-6",
        className
      )}
    >
      {children}
    </div>
  );
}
