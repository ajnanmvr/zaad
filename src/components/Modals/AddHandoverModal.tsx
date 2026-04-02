"use client";

import { TBaseData } from "@/types/types";
import axios from "axios";
import clsx from "clsx";
import { debounce } from "lodash";
import React, { useState, useEffect } from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiFileText,
  FiInfo,
  FiUserPlus,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

interface AddHandoverModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  initialEntity?: {
    id: string;
    name: string;
    type: string;
  };
}

const AddHandoverModal = ({ isOpen, onSuccess, onCancel, initialEntity }: AddHandoverModalProps) => {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<TBaseData[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [entityListLimit, setEntityListLimit] = useState<number>(8);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    entity: "",
    documentName: "",
    remarks: "",
    receivedAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
  });

  useEffect(() => {
    if (isOpen && initialEntity) {
      setSelectedOption(initialEntity.type);
      setSearchValue(initialEntity.name);
      setEntityListLimit(8);
      setFormData((prev) => ({
        ...prev,
        entity: initialEntity.id,
      }));
    } else if (isOpen) {
      setSelectedOption("");
      setSearchValue("");
      setEntityListLimit(8);
      setSearchSuggestions([]);
      setFormData({
        entity: "",
        documentName: "",
        remarks: "",
        receivedAt: new Date().toISOString().slice(0, 16),
      });
    }
  }, [isOpen, initialEntity]);

  const fetchSearchSuggestions = async (
    inputValue: string,
    inputName: string
  ) => {
    try {
      if (inputValue.length > 0) {
        const response = await axios.get<TBaseData[]>(
          `/api/${inputName}/search/${inputValue}`
        );
        setSearchSuggestions(response.data);
      } else {
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const debounceSearch = debounce((input: string, name: string) => {
    fetchSearchSuggestions(input, name);
  }, 300);

  const handleSearchChange = (e: any) => {
    setSearchValue(e.target.value);
    setFormData((prev) => ({ ...prev, entity: "" }));
    debounceSearch(e.target.value, selectedOption);
  };

  const handleEntitySelection = (selected: TBaseData) => {
    setSearchValue(selected.name);
    setFormData({
      ...formData,
      entity: selected._id || "",
    });
    setSearchSuggestions([]);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.entity) {
      toast.error("Please select a company or individual");
      return;
    }
    if (!formData.documentName) {
      toast.error("Please enter the document name");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/api/documents/handover", formData);
      toast.success("Document submission recorded successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to record submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass =
    "w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400 dark:disabled:bg-slate-800";
  const labelClass = "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500";
  const visibleSuggestions = searchSuggestions.slice(0, entityListLimit);

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/60 bg-cyan-100/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-700/40 dark:bg-cyan-900/30 dark:text-cyan-300">
              Physical Handover
            </p>
            <h3 className="mt-3 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Record Document Submission
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Select entity, enter document details, and confirm submission.
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
                  disabled={!!initialEntity}
                  title="Entity Type"
                  value={selectedOption}
                  onChange={(e) => {
                    setSelectedOption(e.target.value);
                    setSearchValue("");
                    setFormData({ ...formData, entity: "" });
                    setSearchSuggestions([]);
                  }}
                  className={inputClass}
                >
                  <option value="" disabled>Select Type</option>
                  <option value="company">Company</option>
                  <option value="employee">Individual / Employee</option>
                  <option value="individual">Direct Individual</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiChevronDown />
                </span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Entity List Size</label>
              <div className="relative z-20">
                <select
                  title="How many entities to show in suggestions"
                  value={entityListLimit}
                  onChange={(e) => setEntityListLimit(Number(e.target.value))}
                  className={inputClass}
                >
                  <option value={5}>Show 5 entities</option>
                  <option value={8}>Show 8 entities</option>
                  <option value={12}>Show 12 entities</option>
                  <option value={20}>Show 20 entities</option>
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
                  disabled={!selectedOption || !!initialEntity}
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder={selectedOption ? `Search ${selectedOption}...` : "Select type first"}
                  className={clsx(inputClass, "pl-11")}
                  autoComplete="off"
                />
              </div>
              {visibleSuggestions.length > 0 && !initialEntity && (
                <ul className="absolute z-30 mt-2 w-full max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  {visibleSuggestions.map((s, key) => (
                    <li
                      className="cursor-pointer px-4 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
                      key={key}
                      onClick={() => handleEntitySelection(s)}
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Document Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <FiFileText />
              </span>
              <input
                type="text"
                name="documentName"
                value={formData.documentName}
                onChange={handleChange}
                placeholder="e.g. Original Passport, Trade License Copy..."
                className={clsx(inputClass, "pl-11")}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Received Date & Time</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FiCalendar />
                </span>
                <input
                  type="datetime-local"
                  name="receivedAt"
                  value={formData.receivedAt}
                  onChange={handleChange}
                  className={clsx(inputClass, "pl-11")}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Remarks</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-slate-400">
                  <FiInfo />
                </span>
                <textarea
                  name="remarks"
                  rows={3}
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Notes..."
                  className={clsx(inputClass, "resize-none pl-11 pt-3")}
                ></textarea>
              </div>
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
              className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-2.5 font-bold text-white transition hover:bg-cyan-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
              ) : (
                "Confirm Submission"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHandoverModal;
