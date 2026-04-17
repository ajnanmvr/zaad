"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import clsx from "clsx";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiPlus,
  FiToggleRight,
  FiTrash2,
  FiX,
} from "react-icons/fi";

type ParticularCategory =
  | "office_records"
  | "company_expense"
  | "liability_in"
  | "liability_out"
  | "instant_profit"
  | "income"
  | "expense";

type TSuggestion = {
  _id: string;
  particular: string;
  category?: ParticularCategory | ParticularCategory[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type TPaginationInfo = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

const CATEGORY_ITEMS: Array<{ value: ParticularCategory; label: string; hint: string }> = [
  { value: "office_records", label: "Office Records", hint: "Regular office income/expense" },
  { value: "company_expense", label: "Company Expense", hint: "Company-specific expense particulars" },
  { value: "liability_in", label: "Liability In", hint: "Incoming liability entries" },
  { value: "liability_out", label: "Liability Out", hint: "Outgoing liability entries" },
  { value: "instant_profit", label: "Instant Profit", hint: "Instant profit records" },
  { value: "income", label: "Income", hint: "Generic income records" },
  { value: "expense", label: "Expense", hint: "Generic expense records" },
];

const LIMIT_OPTIONS = [10, 20, 50];

type ModalMode = "create" | "edit";

export default function ParticularSuggestionsManager() {
  const [suggestions, setSuggestions] = useState<TSuggestion[]>([]);
  const [pagination, setPagination] = useState<TPaginationInfo>({
    page: 0,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterCategories, setFilterCategories] = useState<ParticularCategory[]>([]);
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "unpublished">("all");
  const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt" | "particular" | "category" | "published">(
    "updatedAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageLimit, setPageLimit] = useState(20);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalParticular, setModalParticular] = useState("");
  const [modalCategories, setModalCategories] = useState<ParticularCategory[]>(["office_records"]);
  const [modalPublished, setModalPublished] = useState(true);
  const [modalSaving, setModalSaving] = useState(false);

  const categoryMap = useMemo(
    () =>
      CATEGORY_ITEMS.reduce<Record<string, string>>((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
    [],
  );

  const fetchSuggestions = useCallback(
    async (page = 0) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageLimit),
          sort: sortBy,
          sortOrder,
          published: filterPublished,
        });

        if (filterCategories.length > 0) {
          params.append("categories", filterCategories.join(","));
        }

        if (searchText.trim()) {
          params.append("q", searchText.trim());
        }

        const { data } = await axios.get(`/api/payment/particular-suggestions/list?${params.toString()}`);
        setSuggestions(data.suggestions || []);
        setPagination(
          data.pagination || {
            page: 0,
            limit: pageLimit,
            total: 0,
            pages: 0,
          },
        );
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        toast.error("Failed to fetch suggestions");
      } finally {
        setLoading(false);
      }
    },
    [filterCategories, filterPublished, pageLimit, searchText, sortBy, sortOrder],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchText(searchInput.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchSuggestions(0);
  }, [fetchSuggestions]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setModalParticular("");
    setModalCategories(["office_records"]);
    setModalPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (suggestion: TSuggestion) => {
    setModalMode("edit");
    setEditingId(suggestion._id);
    setModalParticular(suggestion.particular || "");
    const existingCategories = Array.isArray(suggestion.category)
      ? suggestion.category
      : suggestion.category
        ? [suggestion.category]
        : ["office_records"];
    setModalCategories(existingCategories as ParticularCategory[]);
    setModalPublished(Boolean(suggestion.published));
    setIsModalOpen(true);
  };

  const toggleFilterCategory = (category: ParticularCategory) => {
    setFilterCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    );
  };

  const toggleModalCategory = (category: ParticularCategory) => {
    setModalCategories((prev) => {
      if (prev.includes(category)) {
        return prev.length > 1 ? prev.filter((item) => item !== category) : prev;
      }
      return [...prev, category];
    });
  };

  const closeModal = () => {
    if (modalSaving) return;
    setIsModalOpen(false);
  };

  const handleSaveModal = async () => {
    const particular = modalParticular.trim();
    if (!particular) {
      toast.error("Type a particular first");
      return;
    }

    try {
      setModalSaving(true);

      if (modalMode === "create") {
        await axios.post("/api/payment/particular-suggestions", {
          particular,
          categories: modalCategories,
        });
        toast.success("Particular suggestion saved");
      } else {
        await axios.patch("/api/payment/particular-suggestions", {
          id: editingId,
          particular,
          category: modalCategories[0],
          published: modalPublished,
        });
        toast.success("Particular suggestion updated");
      }

      setIsModalOpen(false);
      await fetchSuggestions(pagination.page);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to save suggestion");
    } finally {
      setModalSaving(false);
    }
  };

  const handleTogglePublish = async (id: string, currentPublished: boolean) => {
    try {
      await axios.patch("/api/payment/particular-suggestions", {
        id,
        published: !currentPublished,
      });
      toast.success(currentPublished ? "Suggestion unpublished" : "Suggestion published");
      fetchSuggestions(pagination.page);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to update suggestion");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this suggestion?")) return;

    try {
      await axios.delete("/api/payment/particular-suggestions", {
        data: { id },
      });
      toast.success("Suggestion deleted");
      fetchSuggestions(pagination.page);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to delete suggestion");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Particular Suggestions Manager
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Search, filter, and manage category-based particular suggestions.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
          >
            <FiPlus />
            Add Particular
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Search
              </label>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search particular..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Categories
              </label>
              <div className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex max-h-28 flex-wrap gap-1 overflow-auto">
                  {CATEGORY_ITEMS.map((item) => {
                    const selected = filterCategories.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleFilterCategory(item.value)}
                        className={clsx(
                          "rounded-md border px-2 py-1 text-xs font-semibold transition",
                          selected
                            ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                            : "border-slate-300 bg-white text-slate-500 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300",
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setFilterCategories([])}
                  className="mt-2 text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                >
                  Clear
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status
              </label>
              <select
                value={filterPublished}
                onChange={(event) =>
                  setFilterPublished(event.target.value as "all" | "published" | "unpublished")
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as "updatedAt" | "createdAt" | "particular" | "category" | "published",
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="updatedAt">Recently Updated</option>
                <option value="createdAt">Recently Created</option>
                <option value="particular">Particular</option>
                <option value="category">Category</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as "asc" | "desc")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Per Page
                </label>
                <select
                  value={pageLimit}
                  onChange={(event) => setPageLimit(Number(event.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {LIMIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {pagination.total} total
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading suggestions...</div>
          ) : suggestions.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No suggestions found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                        Particular
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                        Category
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        Published
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                        Updated
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map((suggestion) => (
                      <tr
                        key={suggestion._id}
                        className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{suggestion.particular}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(suggestion.category)
                              ? suggestion.category
                              : suggestion.category
                                ? [suggestion.category]
                                : ["office_records"]
                            ).map((category) => (
                              <span
                                key={`${suggestion._id}-${category}`}
                                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {categoryMap[category] || category}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={clsx(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                              suggestion.published
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
                            )}
                          >
                            {suggestion.published ? "✓" : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(suggestion.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openEditModal(suggestion)}
                              className="rounded-lg p-1.5 text-cyan-600 transition hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-950/30"
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleTogglePublish(suggestion._id, suggestion.published)}
                              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                              title={suggestion.published ? "Unpublish" : "Publish"}
                            >
                              <FiToggleRight size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(suggestion._id)}
                              className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Page {pagination.page + 1} of {pagination.pages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchSuggestions(Math.max(0, pagination.page - 1))}
                      disabled={pagination.page === 0}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <FiChevronLeft size={16} />
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        fetchSuggestions(Math.min(Math.max(0, pagination.pages - 1), pagination.page + 1))
                      }
                      disabled={pagination.page >= pagination.pages - 1}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Next
                      <FiChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {modalMode === "create" ? "Add Particular Suggestion" : "Edit Particular Suggestion"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={modalSaving}
                className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                title="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Particular
                </label>
                <input
                  value={modalParticular}
                  onChange={(event) => setModalParticular(event.target.value)}
                  placeholder="Type particular name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Category
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {CATEGORY_ITEMS.map((item) => {
                    const selected = modalCategories.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleModalCategory(item.value)}
                        className={clsx(
                          "rounded-xl border px-3 py-2 text-left transition",
                          selected
                            ? "border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-200"
                            : "border-slate-300 bg-white/70 text-slate-500 opacity-60 hover:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                        )}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider">{item.label}</p>
                        <p className="mt-1 text-[11px]">{item.hint}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  You can select multiple categories for one particular.
                </p>
              </div>

              {modalMode === "edit" && (
                <div className="flex items-center gap-2">
                  <input
                    id="modal-published"
                    type="checkbox"
                    checked={modalPublished}
                    onChange={(event) => setModalPublished(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <label htmlFor="modal-published" className="text-sm text-slate-700 dark:text-slate-300">
                    Published
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700">
              <button
                type="button"
                onClick={closeModal}
                disabled={modalSaving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={modalSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
              >
                {modalSaving ? "Saving..." : modalMode === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
