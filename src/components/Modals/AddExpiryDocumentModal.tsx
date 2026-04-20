"use client";

import EntityAvatar from "@/components/common/EntityAvatar";
import { TBaseData } from "@/types/types";
import axios from "axios";
import clsx from "clsx";
import { debounce } from "lodash";
import React, { useEffect, useMemo, useState } from "react";
import { FiBriefcase, FiCalendar, FiChevronDown, FiFileText, FiFolder, FiInfo, FiUserPlus } from "react-icons/fi";
import { toast } from "react-hot-toast";

interface AddExpiryDocumentModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

type EntityType = "company" | "employee" | "individual";
type DocumentCategory = "visa" | "license" | "other";

const AddExpiryDocumentModal = ({ isOpen, onSuccess, onCancel }: AddExpiryDocumentModalProps) => {
  const SUGGESTION_LIMIT = 8;
  const [selectedOption, setSelectedOption] = useState<EntityType | "">("");
  const [searchSuggestions, setSearchSuggestions] = useState<TBaseData[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedEntitySummary, setSelectedEntitySummary] = useState<{
    id: string;
    name: string;
    color?: string;
    type: string;
  } | null>(null);
  const [documentTemplateOptions, setDocumentTemplateOptions] = useState<Array<{ id: string; name: string; color?: string; category?: DocumentCategory }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    entity: "",
    category: "" as "" | DocumentCategory,
    documentTemplate: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedOption("");
    setSearchSuggestions([]);
    setSearchValue("");
    setSelectedEntitySummary(null);
    setFormData({
      entity: "",
      category: "",
      documentTemplate: "",
      issueDate: "",
      expiryDate: "",
      notes: "",
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void axios.get("/api/templates", { params: { type: "document" } }).then((response) => {
      setDocumentTemplateOptions(Array.isArray(response.data?.options) ? response.data.options : []);
    });
  }, [isOpen]);

  const fetchSearchSuggestions = async (inputValue: string, inputName: string) => {
    try {
      if (inputValue.length > 0) {
        const response = await axios.get<TBaseData[]>(`/api/${inputName}/search/${inputValue}`);
        setSearchSuggestions(response.data);
      } else {
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const debounceSearch = useMemo(
    () => debounce((input: string, name: string) => {
      fetchSearchSuggestions(input, name);
    }, 300),
    [],
  );

  useEffect(() => {
    return () => {
      debounceSearch.cancel();
    };
  }, [debounceSearch]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    setSelectedEntitySummary(null);
    setFormData((prev) => ({ ...prev, entity: "" }));
    if (selectedOption) {
      debounceSearch(event.target.value, selectedOption);
    }
  };

  const handleEntitySelection = (selected: TBaseData) => {
    setSearchValue(selected.name);
    setSelectedEntitySummary({
      id: selected._id || "",
      name: selected.name,
      color: selected.color,
      type: selected.entityType || selectedOption,
    });
    setFormData((prev) => ({ ...prev, entity: selected._id || "" }));
    setSearchSuggestions([]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedOption) {
      toast.error("Please select an entity type");
      return;
    }
    if (!formData.entity) {
      toast.error("Please select an entity");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a document category");
      return;
    }
    if (!formData.documentTemplate) {
      toast.error("Please select a document");
      return;
    }
    if (!formData.expiryDate) {
      toast.error("Please choose an expiry date");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`/api/${selectedOption}/${formData.entity}/doc`, {
        documentTemplate: formData.documentTemplate,
        issueDate: formData.issueDate || undefined,
        expiryDate: formData.expiryDate,
        notes: formData.notes || undefined,
      });
      toast.success("Document added successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTemplateOptions = useMemo(() => {
    if (!formData.category) {
      return [];
    }

    return documentTemplateOptions.filter(
      (option) => (option.category || "other") === formData.category,
    );
  }, [documentTemplateOptions, formData.category]);

  if (!isOpen) return null;

  const inputClass =
    "w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none transition focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-amber-400 dark:disabled:bg-slate-800";
  const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500";
  const visibleSuggestions = searchSuggestions.slice(0, SUGGESTION_LIMIT);
  const selectedDocumentTemplate = documentTemplateOptions.find(
    (option) => option.id === formData.documentTemplate,
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-300">
              <FiFileText />
              Add Document
            </p>
            <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Add Expiry Document
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Select an entity, attach a document, and save it to the expiry list.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Entity Type <span className="text-rose-500">*</span>
              </label>
              <div className="relative z-20">
                <select
                  title="Entity Type"
                  value={selectedOption}
                  onChange={(event) => {
                    setSelectedOption(event.target.value as EntityType | "");
                    setSearchValue("");
                    setSelectedEntitySummary(null);
                    setFormData((prev) => ({ ...prev, entity: "" }));
                    setSearchSuggestions([]);
                  }}
                  className={inputClass}
                >
                  <option value="" disabled>Select Type</option>
                  <option value="company">Company</option>
                  <option value="employee">Employee</option>
                  <option value="individual">Individual</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiChevronDown />
                </span>
              </div>
            </div>

            <div className="relative">
              <label className={labelClass}>
                Search Entity <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  {selectedOption === "company" ? <FiBriefcase /> : <FiUserPlus />}
                </span>
                <input
                  type="text"
                  disabled={!selectedOption}
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder={selectedOption ? `Search ${selectedOption}...` : "Select type first"}
                  className={clsx(inputClass, "pl-11")}
                  autoComplete="off"
                />
              </div>
              {searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-[60] mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Showing {visibleSuggestions.length} of {searchSuggestions.length} results
                  </div>
                  <ul className="max-h-52 overflow-y-auto py-1">
                  {visibleSuggestions.map((entity, key) => (
                    <li
                      className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-amber-300"
                      key={key}
                      onClick={() => handleEntitySelection(entity)}
                    >
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={entity.name} color={entity.color} size="sm" />
                        <div className="flex flex-col">
                          <span className="max-w-[220px] truncate font-medium">{entity.name}</span>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">
                            {entity.entityType || selectedOption}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                </div>
              )}

              {selectedEntitySummary && formData.entity && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-900/10">
                  <EntityAvatar name={selectedEntitySummary.name} color={selectedEntitySummary.color} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedEntitySummary.name}</p>
                    <p className="text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-300">{selectedEntitySummary.type}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Document Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiFolder />
                </span>
                <select
                  value={formData.category}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: event.target.value as "" | DocumentCategory,
                      documentTemplate: "",
                    }))
                  }
                  className={clsx(inputClass, "pl-11")}
                >
                  <option value="">Select category</option>
                  <option value="visa">Visa Related</option>
                  <option value="license">License Related</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Document Name / Template <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiFileText />
                </span>
                <select
                  value={formData.documentTemplate}
                  disabled={!formData.category}
                  onChange={(event) => setFormData((prev) => ({ ...prev, documentTemplate: event.target.value }))}
                  className={clsx(inputClass, "pl-11")}
                >
                  <option value="">
                    {formData.category ? "Select document" : "Select category first"}
                  </option>
                  {filteredTemplateOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.name || "Unnamed document"}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedDocumentTemplate ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 dark:border-amber-900/40 dark:bg-amber-900/20">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: selectedDocumentTemplate.color || "#F59E0B" }}
                >
                  <FiFileText className="text-sm" />
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {selectedDocumentTemplate.name || "Unnamed document"}
                </span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Issue Date</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiCalendar />
                </span>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(event) => setFormData((prev) => ({ ...prev, issueDate: event.target.value }))}
                  className={clsx(inputClass, "pl-11")}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Expiry Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiCalendar />
                </span>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(event) => setFormData((prev) => ({ ...prev, expiryDate: event.target.value }))}
                  className={clsx(inputClass, "pl-11")}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <div className="relative">
              <span className="absolute left-4 top-4 text-slate-400">
                <FiInfo />
              </span>
              <textarea
                value={formData.notes}
                onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                rows={3}
                placeholder="Notes..."
                className={clsx(inputClass, "resize-none pl-11 pt-3")}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
              ) : (
                "Add Document"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpiryDocumentModal;