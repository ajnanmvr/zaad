"use client";
import { TBaseData } from "@/types/types";
import axios from "axios";
import clsx from "clsx";
import { debounce } from "lodash";
import React, { useState, useEffect } from "react";
import { FiChevronDown, FiUserPlus, FiBriefcase, FiFileText, FiCalendar, FiInfo } from "react-icons/fi";
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
      setFormData((prev) => ({
        ...prev,
        entity: initialEntity.id,
      }));
    } else if (isOpen) {
       // Reset if no initial entity
       setSelectedOption("");
       setSearchValue("");
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

  const inputClass = "w-full appearance-none rounded border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";
  const labelClass = "mb-2 block text-sm font-medium text-black dark:text-white";

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto pt-10 pb-10">
      <div className="bg-white dark:bg-black p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4">
        <h3 className="text-center font-bold text-2xl mb-6 text-primary">
          Record Document Submission
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
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
              {searchSuggestions.length > 0 && !initialEntity && (
                <ul className="absolute z-30 mt-2 w-full max-h-48 overflow-y-auto rounded-lg border border-stroke bg-white py-1 shadow-lg dark:border-form-strokedark dark:bg-form-input">
                  {searchSuggestions.map((s, key) => (
                    <li
                      className="cursor-pointer px-4 py-2 text-sm text-black hover:bg-slate-50 hover:text-primary dark:text-white dark:hover:bg-slate-700"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Received Date & Time
              </label>
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
                    rows={1}
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Notes..."
                    className={clsx(inputClass, "pl-11 py-3 resize-none")}
                  ></textarea>
               </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-stroke bg-gray-300 px-4 py-2 font-medium text-black transition hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-primary py-2 font-bold text-white transition hover:bg-opacity-90 disabled:opacity-50"
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
