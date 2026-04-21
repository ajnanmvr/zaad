"use client";

import { FormEvent, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import clsx from "clsx";
import Link from "next/link";
import {
  FiAlertCircle,
  FiEdit2,
  FiFileText,
  FiLock,
  FiX,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import ColorPicker from "@/components/Forms/ColorPicker";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import {
  getPaymentMethodIcon,
  PAYMENT_METHOD_ICON_OPTIONS,
} from "@/config/paymentMethodIcons";
import {
  DEFAULT_PAYMENT_TEMPLATE_ICON,
  TPaymentTemplateIcon,
} from "@/config/templateVisuals";
import {
  DOCUMENT_CATEGORY_OPTIONS,
  getDocumentCategoryIcon,
  getDocumentCategoryLabel,
  normalizeDocumentCategory,
  TDocumentCategory,
} from "@/config/documentCategoryVisuals";

type ManagerType =
  | "document"
  | "credential"
  | "payment"
  | "payment-status"
  | "office-expense-category";

type ItemOption = {
  id: string;
  name?: string;
  platform?: string;
  method?: string;
  status?: string;
  appliesTo?: "income" | "expense" | "both";
  color?: string;
  category?: TDocumentCategory;
  icon?: TPaymentTemplateIcon;
  categoryName?: string;
  published?: boolean;
  unpublished?: boolean;
  createdAt?: string;
  usageCount?: number;
};

type TypePlatformManagerProps = {
  type: ManagerType;
  title: string;
  subtitle: string;
  addButtonLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  usageLabel: string;
  accent: "emerald" | "blue" | "amber";
  itemHrefBuilder?: (item: ItemOption) => string | null;
};

function TypePlatformManager({
  type,
  title,
  subtitle,
  addButtonLabel,
  inputLabel,
  inputPlaceholder,
  usageLabel,
  accent,
  itemHrefBuilder,
}: TypePlatformManagerProps) {
  const queryClient = useQueryClient();

  const [value, setValue] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedIcon, setSelectedIcon] = useState<TPaymentTemplateIcon>(
    DEFAULT_PAYMENT_TEMPLATE_ICON,
  );
  const [selectedAppliesTo, setSelectedAppliesTo] = useState<
    "income" | "expense" | "both"
  >("both");
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<TDocumentCategory>("other");
  const [colorPickerKey, setColorPickerKey] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmUnpublishId, setConfirmUnpublishId] = useState<string | null>(null);

  const queryKey = [
    type === "document"
      ? "document-types"
      : type === "credential"
        ? "credential-platforms"
        : type === "payment"
          ? "payment-methods"
          : type === "payment-status"
            ? "payment-statuses"
            : "office-expense-categories",
  ];

  const { data: items = [], isLoading } = useQuery<ItemOption[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", { params: { type } });
      return (data?.options || []) as ItemOption[];
    },
  });

  const accentClasses =
    accent === "emerald"
      ? {
          button: "bg-emerald-600 hover:bg-emerald-700",
          focus: "focus:border-emerald-500 focus:ring-emerald-500/20",
          badge:
            "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
          icon: "text-emerald-500",
        }
      : {
          button: "bg-blue-600 hover:bg-blue-700",
          focus: "focus:border-blue-500 focus:ring-blue-500/20",
          badge:
            "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
          icon: "text-blue-500",
        };

  if (accent === "amber") {
    Object.assign(accentClasses, {
      button: "bg-amber-600 hover:bg-amber-700",
      focus: "focus:border-amber-500 focus:ring-amber-500/20",
      badge:
        "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
      icon: "text-amber-500",
    });
  }

  const itemName = (item: ItemOption) =>
    type === "document"
      ? item.name || "Untitled"
      : type === "credential"
        ? item.platform || "Untitled"
        : type === "payment"
          ? item.method || "Untitled"
          : type === "payment-status"
            ? item.status || "Untitled"
            : item.category || item.categoryName || "Untitled";

  const getPaymentIcon = (iconName?: TPaymentTemplateIcon) => {
    return getPaymentMethodIcon(iconName);
  };

  const openAddModal = () => {
    setEditingId(null);
    setValue("");
    setSelectedColor("");
    setSelectedIcon(DEFAULT_PAYMENT_TEMPLATE_ICON);
    setSelectedAppliesTo("both");
    setSelectedDocumentCategory("other");
    setColorPickerKey((prev) => prev + 1);
    setShowAddForm(true);
  };

  const openEditModal = (item: ItemOption) => {
    setEditingId(item.id);
    setValue(
      type === "document"
        ? item.name || ""
        : type === "credential"
          ? item.platform || ""
          : type === "payment"
            ? item.method || ""
            : type === "payment-status"
              ? item.status || ""
              : item.category || item.categoryName || "",
    );
    setSelectedColor(item.color || "");
    setSelectedIcon((item.icon || DEFAULT_PAYMENT_TEMPLATE_ICON) as TPaymentTemplateIcon);
    setSelectedAppliesTo(item.appliesTo || "both");
    setSelectedDocumentCategory(normalizeDocumentCategory(item.category));
    setColorPickerKey((prev) => prev + 1);
    setShowAddForm(true);
  };

  const closeAddModal = () => {
    setShowAddForm(false);
    setEditingId(null);
    setValue("");
    setSelectedColor("");
    setSelectedIcon(DEFAULT_PAYMENT_TEMPLATE_ICON);
    setSelectedAppliesTo("both");
    setSelectedDocumentCategory("other");
  };

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();

    if (!value.trim()) {
      toast.error(`Please enter ${inputLabel.toLowerCase()}`);
      return;
    }

    setIsAdding(true);
    try {
      const payload = {
        type,
        ...(editingId ? { id: editingId } : {}),
        ...(type === "document" || type === "payment" || type === "payment-status"
          ? { color: selectedColor || undefined }
          : {}),
        ...(type === "document"
          ? { name: value.trim(), category: selectedDocumentCategory }
          : type === "credential"
            ? { platform: value.trim() }
            : type === "payment"
              ? { method: value.trim(), icon: selectedIcon }
              : type === "payment-status"
                ? { status: value.trim(), appliesTo: selectedAppliesTo }
                : { category: value.trim(), icon: selectedIcon }),
      };

      if (editingId) {
        await axios.put("/api/templates", payload);
      } else {
        await axios.post("/api/templates", payload);
      }

      toast.success(`${title.slice(0, -1)} ${editingId ? "updated" : "added"} successfully`);
      setValue("");
      setSelectedColor("");
      setSelectedIcon(DEFAULT_PAYMENT_TEMPLATE_ICON);
      setSelectedAppliesTo("both");
      setSelectedDocumentCategory("other");
      setEditingId(null);
      setColorPickerKey((prev) => prev + 1);
      setShowAddForm(false);
      await queryClient.invalidateQueries({ queryKey });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(
        message || `Failed to add ${title.slice(0, -1).toLowerCase()}`,
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete("/api/templates", {
        params: { id, type },
      });
      toast.success(`${title.slice(0, -1)} unpublished successfully`);
      await queryClient.invalidateQueries({ queryKey });
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(
        message || `Failed to unpublish ${title.slice(0, -1).toLowerCase()}`,
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-8">
      <ConfirmationModal
        isOpen={Boolean(confirmUnpublishId)}
        title="Unpublish Template"
        message={`Unpublish this ${title.slice(0, -1).toLowerCase()}? Existing records using it will keep working.`}
        confirmLabel="Unpublish"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={Boolean(deletingId)}
        onCancel={() => {
          if (!deletingId) {
            setConfirmUnpublishId(null);
          }
        }}
        onConfirm={() => {
          if (confirmUnpublishId) {
            void handleDelete(confirmUnpublishId);
          }
          setConfirmUnpublishId(null);
        }}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className={clsx(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition",
            accentClasses.button,
          )}
        >
          <FiPlus />
          {addButtonLabel}
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className={clsx("inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider", accentClasses.badge)}>
                  <FiPlus /> Add {title.slice(0, -1)}
                </p>
                <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {editingId ? "Edit" : "Add"} {title.slice(0, -1)}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingId
                    ? `Update this ${title.slice(0, -1).toLowerCase()} and save your changes.`
                    : `Create a new ${title.slice(0, -1).toLowerCase()} and publish it for use across the app.`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {inputLabel}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={inputPlaceholder}
                  className={clsx(
                    "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
                    accentClasses.focus,
                  )}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className={clsx(
                    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
                    accentClasses.button,
                  )}
                >
                  {isAdding ? (editingId ? "Saving..." : "Adding...") : "Save"}
                </button>
              </div>

              {(type === "document" || type === "payment" || type === "payment-status" || type === "office-expense-category") && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <ColorPicker
                    key={colorPickerKey}
                    selectedColor={selectedColor}
                    onChange={(color) => setSelectedColor(color || "")}
                    label={
                      type === "document"
                        ? "Template Color"
                        : type === "payment"
                          ? "Method Color"
                          : type === "payment-status"
                            ? "Status Color"
                            : "Category Color"
                    }
                    allowAutoAssign
                  />
                </div>
              )}

              {(type === "payment" || type === "office-expense-category") && (
                <div>
                  <p className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {type === "payment" ? "Payment Icon" : "Category Icon"}
                  </p>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
                    {PAYMENT_METHOD_ICON_OPTIONS.map(({ value: iconValue, label, Icon }) => (
                      <button
                        key={iconValue}
                        type="button"
                        onClick={() => setSelectedIcon(iconValue)}
                        className={clsx(
                          "inline-flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-semibold transition",
                          selectedIcon === iconValue
                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-300"
                            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                        )}
                        title={label}
                      >
                        <Icon className="text-lg" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {type === "payment-status" && (
                <div>
                  <p className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Apply Status To
                  </p>
                  <select
                    value={selectedAppliesTo}
                    onChange={(event) =>
                      setSelectedAppliesTo(
                        event.target.value as "income" | "expense" | "both",
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="both">Both (Income + Expense)</option>
                    <option value="income">Income Only</option>
                    <option value="expense">Expense Only</option>
                  </select>
                </div>
              )}

              {type === "document" && (
                <div>
                  <p className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </p>
                  <select
                    value={selectedDocumentCategory}
                    onChange={(event) =>
                      setSelectedDocumentCategory(
                        normalizeDocumentCategory(event.target.value),
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {DOCUMENT_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-800/40">
          <FiAlertCircle className="mx-auto mb-2 text-2xl text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No items yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const DocumentIcon = getDocumentCategoryIcon(item.category);
            return (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  {type === "payment" &&
                    (() => {
                      const Icon = getPaymentIcon(item.icon);
                      return (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                          style={{
                            backgroundColor: item.color
                              ? `${item.color}1A`
                              : undefined,
                            color: item.color || undefined,
                          }}
                        >
                          <Icon className="text-sm" />
                        </span>
                      );
                    })()}
                  {type === "office-expense-category" &&
                    (() => {
                      const Icon = getPaymentIcon(item.icon);
                      return (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md"
                          style={{
                            backgroundColor: item.color
                              ? `${item.color}1A`
                              : undefined,
                            color: item.color || undefined,
                          }}
                        >
                          <Icon className="text-sm" />
                        </span>
                      );
                    })()}
                  {type === "document" && (
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: item.color || "#F59E0B" }}
                    >
                      <DocumentIcon className="text-sm" />
                    </span>
                  )}
                  {type === "credential" && (
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: item.color || "#3C50E0" }}
                    >
                      <FiLock className="text-sm" />
                    </span>
                  )}
                  {type === "payment-status" && item.color && (
                    <span
                      className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  {(() => {
                    const href = itemHrefBuilder?.(item);
                    const label = itemName(item);

                    if (!href) {
                      return label;
                    }

                    return (
                      <Link href={href} className="hover:text-blue-600 hover:underline dark:hover:text-blue-300">
                        {label}
                      </Link>
                    );
                  })()}
                  {item.unpublished && (
                    <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      Unpublished
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.createdAt
                    ? `Created: ${new Date(item.createdAt).toLocaleDateString()}`
                    : ""}
                </p>
                {type === "payment-status" && item.appliesTo ? (
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Applies to: {item.appliesTo}
                  </p>
                ) : null}
                {type === "document" ? (
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Category: {getDocumentCategoryLabel(item.category)}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset",
                    accentClasses.badge,
                  )}
                >
                  {item.usageCount || 0} {usageLabel}
                </span>
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-slate-700"
                  title="Edit"
                >
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmUnpublishId(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:bg-slate-700"
                  title="Unpublish"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TypePlatformManager;
