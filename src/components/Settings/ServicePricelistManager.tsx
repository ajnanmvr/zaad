"use client";

import { FormEvent, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import clsx from "clsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiAlertCircle,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTag,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import ColorPicker from "@/components/Forms/ColorPicker";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { useUserContext } from "@/contexts/UserContext";
import { hasPermission } from "@/auth/permissions";
import {
  SERVICE_KIND_OPTIONS,
  SERVICE_KIND_SHORT_LABELS,
  ServiceKind,
  normalizeServiceKind,
} from "@/config/serviceKinds";
import {
  getServiceKindAccent,
  getServiceKindIcon,
} from "@/config/serviceKindVisuals";

type ServiceItem = {
  id: string;
  name: string;
  price: number;
  kind: ServiceKind;
  color?: string;
  published?: boolean;
  unpublished?: boolean;
  usageCount?: number;
  createdAt?: string;
};

const REQUIRED_PERMISSIONS = [
  "settings.manage.services",
  "payments.write",
  "settings.write",
];

const QUERY_KEY = ["service-templates"];

const priceFormatter = new Intl.NumberFormat("en-AE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPrice = (value: number) =>
  priceFormatter.format(Number.isFinite(value) ? value : 0);

function ServicePricelistManager() {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const userPermissions = Array.isArray(user?.permissions)
    ? (user.permissions as string[])
    : [];
  const canAccess = REQUIRED_PERMISSIONS.some((permission) =>
    hasPermission(userPermissions, permission),
  );

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<ServiceKind | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [kind, setKind] = useState<ServiceKind | "">("");
  const [color, setColor] = useState("");
  const [colorPickerKey, setColorPickerKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery<ServiceItem[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", {
        params: { type: "service" },
      });
      return ((data?.options || []) as any[]).map((option) => ({
        ...option,
        kind: normalizeServiceKind(option?.kind),
      })) as ServiceItem[];
    },
  });

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...items]
      .filter((item) => (kindFilter === "all" ? true : item.kind === kindFilter))
      .filter((item) => (term ? item.name.toLowerCase().includes(term) : true))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [items, search, kindFilter]);

  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const option of SERVICE_KIND_OPTIONS) {
      counts[option.value] = items.filter(
        (item) => item.kind === option.value,
      ).length;
    }
    return counts;
  }, [items]);

  const openAddModal = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setKind("");
    setColor("");
    setColorPickerKey((prev) => prev + 1);
    setShowForm(true);
  };

  const openEditModal = (item: ServiceItem) => {
    setEditingId(item.id);
    setName(item.name || "");
    setPrice(typeof item.price === "number" ? item.price : "");
    setKind(normalizeServiceKind(item.kind));
    setColor(item.color || "");
    setColorPickerKey((prev) => prev + 1);
    setShowForm(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setShowForm(false);
    setEditingId(null);
    setName("");
    setPrice("");
    setKind("");
    setColor("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a service name");
      return;
    }
    if (price === "" || Number.isNaN(Number(price)) || Number(price) < 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!kind) {
      toast.error("Please choose a category");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        type: "service",
        ...(editingId ? { id: editingId } : {}),
        name: name.trim(),
        price: Number(price) || 0,
        kind,
        color: color || undefined,
      };

      if (editingId) {
        await axios.put("/api/templates", payload);
      } else {
        await axios.post("/api/templates", payload);
      }

      toast.success(`Service ${editingId ? "updated" : "added"} successfully`);
      closeModal();
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          `Failed to ${editingId ? "update" : "add"} service`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setDeletingId(id);
    try {
      await axios.delete("/api/templates", { params: { id, type: "service" } });
      toast.success("Service removed from catalogue");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to remove service");
    } finally {
      setDeletingId(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 sm:p-8">
        You do not have permission to manage the service catalogue.
      </div>
    );
  }

  const kindTabs: Array<{ value: ServiceKind | "all"; label: string }> = [
    { value: "all", label: "All" },
    ...SERVICE_KIND_OPTIONS,
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <ConfirmationModal
        isOpen={Boolean(confirmRemoveId)}
        title="Remove Service"
        message="Remove this service from the catalogue? Existing records that reference it keep working."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={Boolean(deletingId)}
        onCancel={() => {
          if (!deletingId) setConfirmRemoveId(null);
        }}
        onConfirm={() => {
          if (confirmRemoveId) void handleRemove(confirmRemoveId);
          setConfirmRemoveId(null);
        }}
      />

      <div className="flex flex-col gap-4 border-b border-slate-200 p-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30">
            <FiTag /> Catalogue
          </p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Service Pricelist
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Catalogue of visa and license services with their standard rates.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <FiPlus />
          Add Service
        </button>
      </div>

      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="relative w-full sm:max-w-xs">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search catalogue..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {kindTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setKindFilter(tab.value)}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition",
                kindFilter === tab.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {tab.label}
              <span
                className={clsx(
                  "rounded-full px-1.5 text-[10px]",
                  kindFilter === tab.value
                    ? "bg-white/25 text-white"
                    : "bg-white text-slate-400 dark:bg-slate-900",
                )}
              >
                {kindCounts[tab.value] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Loading catalogue...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center dark:border-slate-700 dark:bg-slate-800/40">
            <FiAlertCircle className="mx-auto mb-2 text-2xl text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {search.trim() || kindFilter !== "all"
                ? "No services match this filter."
                : "No services in the catalogue yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
              const CardIcon = getServiceKindIcon(item.kind);
              const accent = item.color || getServiceKindAccent(item.kind);
              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ backgroundColor: accent }}
                  />

                  <div className="flex items-start justify-between gap-3 p-4 pb-3">
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: accent }}
                    >
                      <CardIcon className="text-base" />
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${accent}1A`, color: accent }}
                    >
                      {SERVICE_KIND_SHORT_LABELS[item.kind]}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col px-4 pb-4">
                    <p className="line-clamp-2 min-h-[2.5rem] text-sm font-bold text-slate-800 dark:text-slate-100">
                      {item.name}
                      {item.unpublished && (
                        <span className="ml-2 align-middle rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                          Hidden
                        </span>
                      )}
                    </p>

                    <div className="mt-auto flex items-end justify-between pt-3">
                      <p className="font-mono text-lg font-black tabular-nums text-slate-900 dark:text-slate-100">
                        <span className="mr-1 text-[11px] font-semibold text-slate-400">
                          AED
                        </span>
                        {formatPrice(Number(item.price) || 0)}
                      </p>

                      <div className="flex items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-slate-800"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:bg-slate-800"
                          title="Remove"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30">
                  <FiTag /> {editingId ? "Edit Service" : "New Service"}
                </p>
                <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {editingId ? "Edit service" : "Add service"}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Set the service name, its category and standard rate.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Service Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g., Emirates ID Renewal, Trade License"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              <div>
                <p className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Category <span className="text-rose-500">*</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {SERVICE_KIND_OPTIONS.map((option) => {
                    const OptionIcon = getServiceKindIcon(option.value);
                    const selected = kind === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setKind(option.value)}
                        className={clsx(
                          "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition",
                          selected
                            ? "border-transparent text-white shadow-sm"
                            : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                        )}
                        style={
                          selected
                            ? {
                                backgroundColor: getServiceKindAccent(
                                  option.value,
                                ),
                              }
                            : undefined
                        }
                      >
                        <OptionIcon className="text-base" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Price
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                    AED
                  </span>
                  <input
                    type="number"
                    value={price}
                    onWheel={(event) => event.currentTarget.blur()}
                    onChange={(event) =>
                      setPrice(
                        event.target.value === ""
                          ? ""
                          : Number(event.target.value) || 0,
                      )
                    }
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-14 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <ColorPicker
                  key={colorPickerKey}
                  selectedColor={color}
                  onChange={(next) => setColor(next || "")}
                  label="Service Color"
                  allowAutoAssign
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (editingId ? "Saving..." : "Adding...") : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServicePricelistManager;
