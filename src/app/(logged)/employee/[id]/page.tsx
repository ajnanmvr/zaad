"use client"
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { useUserContext } from "@/contexts/UserContext";
import { TEmployeeData } from "@/types/types";
import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiMoreVertical, FiEdit2, FiTrash2, FiFileText, FiUser, FiLock, FiPhone, FiMail } from "react-icons/fi";
import clsx from "clsx";
import calculateStatus from "@/utils/calculateStatus";
import calculateDaysLeft from "@/utils/calculateDaysLeft";
import HandoverList from "@/components/HandoverList";

const SingleEmployee = () => {
  const router = useRouter()
  const [employee, setEmployee] = useState<TEmployeeData | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isEditDocsOpen, setIsEditDocsOpen] = useState(false);
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [isAddCredentialOpen, setIsAddCredentialOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true)
  const [editData, setEditData] = useState({
    documentTemplate: "",
    name: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  });
  const [addDocumentData, setAddDocumentData] = useState({
    documentTemplate: "",
    name: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  });
  const [addCredentialData, setAddCredentialData] = useState({
    credentialTemplate: "",
    platform: "",
    username: "",
    password: "",
    notes: "",
  });
  const [documentTemplateOptions, setDocumentTemplateOptions] = useState<
    Array<{ id: string; name?: string; label?: string }>
  >([]);
  const [credentialTemplateOptions, setCredentialTemplateOptions] = useState<
    Array<{ id: string; platform?: string; label?: string }>
  >([]);
  const [isConfirmationOpenCompany, setIsConfirmationOpenCompany] = useState(false);
  const { id }: { id: string } = useParams()
  const { user } = useUserContext();
  const employeeCredentials = useMemo(() => {
    return employee?.credentials?.length
      ? employee.credentials
      : employee?.password || [];
  }, [employee]);
  const employeeDocuments = useMemo(() => employee?.documents || [], [employee]);
  const [documentNameFilter, setDocumentNameFilter] = useState("all");
  const [credentialPlatformFilter, setCredentialPlatformFilter] = useState("all");

  const documentNames = useMemo(() => {
    return Array.from(
      new Set(
        employeeDocuments
          .map((doc) => doc?.name?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );
  }, [employeeDocuments]);

  const credentialPlatforms = useMemo(() => {
    return Array.from(
      new Set(
        employeeCredentials
          .map((credential) => credential?.platform?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );
  }, [employeeCredentials]);

  const filteredEmployeeDocuments = useMemo(() => {
    if (documentNameFilter === "all") {
      return employeeDocuments;
    }
    return employeeDocuments.filter(
      (doc) => (doc.name || "unnamed") === documentNameFilter
    );
  }, [employeeDocuments, documentNameFilter]);

  const filteredEmployeeCredentials = useMemo(() => {
    if (credentialPlatformFilter === "all") {
      return employeeCredentials;
    }
    return employeeCredentials.filter(
      (credential) => (credential.platform || "unspecified") === credentialPlatformFilter
    );
  }, [employeeCredentials, credentialPlatformFilter]);

  const fetchTemplateOptions = useCallback(async () => {
    try {
      const [documentRes, credentialRes] = await Promise.all([
        axios.get("/api/templates", { params: { type: "document" } }),
        axios.get("/api/templates", { params: { type: "credential" } }),
      ]);
      setDocumentTemplateOptions(
        Array.isArray(documentRes.data?.options) ? documentRes.data.options : []
      );
      setCredentialTemplateOptions(
        Array.isArray(credentialRes.data?.options) ? credentialRes.data.options : []
      );
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }, []);

  const fetchData = async () => {
    try {
      const data = await axios.get(`/api/employee/${id}`)
      setEmployee(data.data.data)
      setIsLoading(false)
    } catch (error) {
      console.log(error);
    }
  }

  const handleDelete = (deleteId: string) => {
    setSelectedDocumentId(deleteId);
    setIsConfirmationOpen(true);
  }
  const handleEdit = (editId: string) => {
    const selectedDocument = employeeDocuments.find(doc => doc._id === editId);
    if (selectedDocument) {
      setEditData({
        documentTemplate: `${selectedDocument.documentTemplate || ""}`,
        name: `${selectedDocument.name}`,
        issueDate: `${selectedDocument.issueDate}`,
        expiryDate: `${selectedDocument.expiryDate}`,
        notes: `${selectedDocument.notes || ""}`,
      });
      setSelectedDocumentId(editId);
      setIsEditDocsOpen(true);
    } else {
      console.error("Document not found!");
    }
  }

  const confirmDelete = async () => {
    console.log("Deleting Document with ID:", selectedDocumentId);
    await axios.delete(`/api/employee/${id}/doc/${selectedDocumentId}`);
    fetchData();
    setIsConfirmationOpen(false);
  };
  const confirmDeleteCompany = async () => {
    await axios.delete(`/api/employee/${id}`);
    router.push("/employee")
  };
  const saveEdits = async () => {
    console.log("Updating Document with ID:", selectedDocumentId);
    await axios.put(`/api/employee/${id}/doc/${selectedDocumentId}`, {
      documentTemplate: editData.documentTemplate,
      issueDate: editData.issueDate,
      expiryDate: editData.expiryDate,
      notes: editData.notes,
    });
    setIsEditDocsOpen(false);
    fetchData();
  };

  const closeModal = () => {
    setSelectedDocumentId(null);
    setIsConfirmationOpen(false);
    setIsConfirmationOpenCompany(false);
    setIsEditDocsOpen(false);
    setIsAddDocumentOpen(false);
    setIsAddCredentialOpen(false);
  }

  const handleAddDocument = () => {
    setAddDocumentData({
      documentTemplate: "",
      name: "",
      issueDate: "",
      expiryDate: "",
      notes: "",
    });
    setIsAddDocumentOpen(true);
  };

  const handleAddCredential = () => {
    setAddCredentialData({
      credentialTemplate: "",
      platform: "",
      username: "",
      password: "",
      notes: "",
    });
    setIsAddCredentialOpen(true);
  };

  const saveNewDocument = async () => {
    if (!addDocumentData.documentTemplate || !addDocumentData.expiryDate) {
      console.error("Document Template and Expiry Date are required");
      return;
    }
    try {
      await axios.post(`/api/employee/${id}/doc`, {
        documentTemplate: addDocumentData.documentTemplate,
        issueDate: addDocumentData.issueDate,
        expiryDate: addDocumentData.expiryDate,
        notes: addDocumentData.notes,
      });
      setIsAddDocumentOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  const saveNewCredential = async () => {
    if (!addCredentialData.credentialTemplate || !addCredentialData.username) {
      console.error("Platform and Username are required");
      return;
    }
    try {
      await axios.post(`/api/employee/${id}/credential`, {
        credentialTemplate: addCredentialData.credentialTemplate,
        username: addCredentialData.username,
        password: addCredentialData.password,
        notes: addCredentialData.notes,
      });
      setIsAddCredentialOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error adding credential:", error);
    }
  };

  const handleAddDocumentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "documentTemplate") {
      const selectedTemplate = documentTemplateOptions.find((option) => option.id === value);
      setAddDocumentData({
        ...addDocumentData,
        documentTemplate: value,
        name: selectedTemplate?.name || selectedTemplate?.label || "",
      });
      return;
    }
    setAddDocumentData({
      ...addDocumentData, [name]: value
    })
  };

  const handleAddCredentialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "credentialTemplate") {
      const selectedTemplate = credentialTemplateOptions.find((option) => option.id === value);
      setAddCredentialData({
        ...addCredentialData,
        credentialTemplate: value,
        platform: selectedTemplate?.platform || selectedTemplate?.label || "",
      });
      return;
    }
    setAddCredentialData({
      ...addCredentialData, [name]: value
    })
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "documentTemplate") {
      const selectedTemplate = documentTemplateOptions.find((option) => option.id === value);
      setEditData({
        ...editData,
        documentTemplate: value,
        name: selectedTemplate?.name || selectedTemplate?.label || "",
      });
      return;
    }

    setEditData({
      ...editData, [name]: value
    })
  }

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const trigger = useRef<any>(null);
  const dropdown = useRef<any>(null);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!dropdown.current) return;
      if (
        !dropdownOpen ||
        dropdown.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return;
      setDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    fetchData()
    void fetchTemplateOptions();
  }, [])

  return (
    <>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          message="Are you sure you want to delete this document?"
          onConfirm={confirmDelete}
          onCancel={closeModal}
        />
        <ConfirmationModal
          isOpen={isConfirmationOpenCompany}
          message="Are you sure you want to delete this employee?"
          onConfirm={confirmDeleteCompany}
          onCancel={closeModal}
        />
        
        {isAddDocumentOpen && (
          <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <h3 className="mb-6 text-xl font-bold text-slate-800 dark:text-white">Add New Document</h3>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Document Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    title="Select document template"
                    name="documentTemplate"
                    required
                    value={addDocumentData.documentTemplate}
                    onChange={handleAddDocumentChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                  >
                    <option value="" disabled>
                      Select document
                    </option>
                    {documentTemplateOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.name || option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="w-full sm:w-1/2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      name="issueDate"
                      value={addDocumentData.issueDate}
                      onChange={handleAddDocumentChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                    />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Expiry Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={addDocumentData.expiryDate}
                      onChange={handleAddDocumentChange}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    name="notes"
                    value={addDocumentData.notes}
                    onChange={handleAddDocumentChange}
                    placeholder="Optional notes"
                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={closeModal} 
                  className="rounded-xl bg-slate-100 px-6 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveNewDocument} 
                  className="rounded-xl bg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-opacity-90 shadow-sm shadow-primary/30"
                >
                  Add Document
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddCredentialOpen && (
          <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <h3 className="mb-6 text-xl font-bold text-slate-800 dark:text-white">Add New Credential</h3>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Platform <span className="text-rose-500">*</span>
                  </label>
                  <select
                    title="Select credential platform"
                    name="credentialTemplate"
                    required
                    value={addCredentialData.credentialTemplate}
                    onChange={handleAddCredentialChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                  >
                    <option value="" disabled>
                      Select platform
                    </option>
                    {credentialTemplateOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.platform || option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={addCredentialData.username}
                    onChange={handleAddCredentialChange}
                    placeholder="Enter username"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={addCredentialData.password}
                    onChange={handleAddCredentialChange}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    name="notes"
                    value={addCredentialData.notes}
                    onChange={handleAddCredentialChange}
                    placeholder="Optional notes"
                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={closeModal} 
                  className="rounded-xl bg-slate-100 px-6 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveNewCredential} 
                  className="rounded-xl bg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-opacity-90 shadow-sm shadow-primary/30"
                >
                  Add Credential
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditDocsOpen && (
          <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <h3 className="mb-6 text-xl font-bold text-slate-800 dark:text-white">Edit Document</h3>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Document Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    title="Select document template"
                    name="documentTemplate"
                    required
                    value={editData.documentTemplate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                  >
                    <option value="" disabled>
                      Select document
                    </option>
                    {documentTemplateOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.name || option.label}</option>
                    ))}
                    {editData.name &&
                      editData.documentTemplate &&
                      !documentTemplateOptions.find((option) => option.id === editData.documentTemplate) && (
                        <option value={editData.documentTemplate}>{editData.name}</option>
                    )}
                  </select>
                </div>
                <div className="flex flex-col gap-5 sm:flex-row">
                  <div className="w-full sm:w-1/2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      name="issueDate"
                      value={editData.issueDate}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                    />
                  </div>
                  <div className="w-full sm:w-1/2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Expiry Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={editData.expiryDate}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    name="notes"
                    value={editData.notes}
                    onChange={handleChange}
                    placeholder="Optional notes"
                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={closeModal} 
                  className="rounded-xl bg-slate-100 px-6 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveEdits} 
                  className="rounded-xl bg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-opacity-90 shadow-sm shadow-primary/30"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent shadow-md"></div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {/* Header section with Dropdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100 dark:bg-slate-800 dark:ring-slate-700 sm:flex">
                    <FiUser className="text-3xl text-indigo-500 opacity-80" />
                  </div>
                  <div>
                    <h2 className="text-3xl capitalize font-bold text-slate-900 dark:text-white">
                      {employee?.name}
                    </h2>
                    {employee?.company && (
                      <Link 
                        href={`/company/${employee.company._id}`} 
                        className="mt-1 flex items-center gap-2 text-sm font-medium capitalize text-primary transition-colors hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-primary/70"></span>
                        {employee.company.name}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <div className="relative">
                    <button
                      ref={trigger}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      <FiMoreVertical className="text-lg" />
                    </button>

                    <div
                      ref={dropdown}
                      className={clsx(
                        "absolute right-0 top-full z-40 mt-2 w-48 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800",
                        dropdownOpen ? "flex" : "hidden"
                      )}
                    >
                      {Array.isArray(user?.permissions) && user.permissions.includes("payments.read") && (
                        <Link 
                          href={`/accounts/transactions/employee/${id}`} 
                          className="px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-white"
                        >
                          Records
                        </Link>
                      )}
                      
                      <Link 
                        href={`/employee/${id}/edit`} 
                        className="px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-white"
                      >
                        Edit Employee
                      </Link>
                      
                      <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                      
                      <button 
                        onClick={() => setIsConfirmationOpenCompany(true)} 
                        className="flex w-full px-5 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      >
                        Delete Employee
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                {/* Employee Details Card */}
                <div className="rounded-xl bg-slate-50 p-6 dark:bg-slate-800/50">
                  <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                    <FiUser className="text-indigo-500" />
                    Employee Details
                  </h3>
                  <dl className="space-y-4">
                    {employee?.emiratesId && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-3 last:border-0 dark:border-slate-700">
                        <dt className="text-sm text-slate-500 dark:text-slate-400">Emirates ID</dt>
                        <dd className="font-semibold text-slate-900 dark:text-slate-200 break-words">{employee.emiratesId}</dd>
                      </div>
                    )}
                    {employee?.nationality && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-3 last:border-0 dark:border-slate-700">
                        <dt className="text-sm text-slate-500 dark:text-slate-400">Nationality</dt>
                        <dd className="font-semibold text-slate-900 dark:text-slate-200 break-words">{employee.nationality}</dd>
                      </div>
                    )}
                    {employee?.phone1 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-3 last:border-0 dark:border-slate-700">
                        <dt className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><FiPhone className="text-xs" /> Phone 1</dt>
                        <dd className="font-semibold text-slate-900 dark:text-slate-200 break-words">{employee.phone1}</dd>
                      </div>
                    )}
                    {employee?.phone2 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-3 last:border-0 dark:border-slate-700">
                        <dt className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><FiPhone className="text-xs" /> Phone 2</dt>
                        <dd className="font-semibold text-slate-900 dark:text-slate-200 break-words">{employee.phone2}</dd>
                      </div>
                    )}
                    {employee?.email && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-3 last:border-0 dark:border-slate-700">
                        <dt className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><FiMail className="text-xs" /> Email</dt>
                        <dd className="font-semibold text-slate-900 dark:text-slate-200 break-words">{employee.email}</dd>
                      </div>
                    )}
                    {employee?.designation && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-3 last:border-0 dark:border-slate-700">
                        <dt className="text-sm text-slate-500 dark:text-slate-400">Designation</dt>
                        <dd className="font-semibold text-slate-900 dark:text-slate-200 break-words">{employee.designation}</dd>
                      </div>
                    )}
                    {employee?.remarks && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-3 last:border-0 dark:border-slate-700">
                        <dt className="text-sm text-slate-500 dark:text-slate-400">Remarks</dt>
                        <dd className="font-semibold text-slate-900 dark:text-slate-200 break-words">{employee.remarks}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Credentials Card */}
                <div className="rounded-xl bg-slate-50 p-6 dark:bg-slate-800/50">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white">
                    <FiLock className="text-rose-500" />
                    Platform Access
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddCredential}
                        className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-opacity-90"
                      >
                        + Add Credential
                      </button>
                      <select
                        title="Filter credentials by platform"
                        value={credentialPlatformFilter}
                        onChange={(event) =>
                          setCredentialPlatformFilter(event.target.value)
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="all">All platforms</option>
                        <option value="unspecified">Unspecified</option>
                        {credentialPlatforms.map((platform) => (
                          <option key={platform} value={platform}>
                            {platform}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {employeeCredentials.length > 0 ? (
                    <div className="space-y-4">
                      {filteredEmployeeCredentials.map((pass, index) => (
                        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-slate-800 dark:text-white">{pass.platform}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
                              <span className="block text-xs text-slate-500 dark:text-slate-400">Username</span>
                              <span className="font-medium text-slate-900 dark:text-slate-200 break-words">{pass.username}</span>
                            </div>
                            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900/50">
                              <span className="block text-xs text-slate-500 dark:text-slate-400">Credential</span>
                              <span className="font-medium text-slate-900 dark:text-slate-200 break-words">{pass.credential || pass.password || "---"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No credentials yet. <button onClick={handleAddCredential} className="text-primary hover:underline">Add one</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Documents Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                  <FiFileText className="text-emerald-500" />
                  Employee Documents
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddDocument}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-opacity-90"
                  >
                    + Add Document
                  </button>
                  <select
                    title="Filter documents by name"
                    value={documentNameFilter}
                    onChange={(event) => setDocumentNameFilter(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="all">All documents</option>
                    <option value="unnamed">Unnamed</option>
                    {documentNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-sm font-semibold tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        <th className="min-w-[220px] pb-3 pl-4">Document Name</th>
                        <th className="min-w-[150px] pb-3 px-4">Issue Date</th>
                        <th className="min-w-[150px] pb-3 px-4">Expiry Date</th>
                        <th className="min-w-[100px] pb-3 px-4">Days Left</th>
                        <th className="min-w-[220px] pb-3 px-4">Notes</th>
                        <th className="min-w-[120px] pb-3 px-4">Status</th>
                        <th className="pb-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployeeDocuments.map(({ name, status, issueDate, expiryDate, notes, _id }, key) => {
                        const daysLeft = calculateDaysLeft(expiryDate);
                        const calculatedStatus = status || calculateStatus(expiryDate || "");
                        return (
                        <tr 
                          key={key} 
                          className="group border-b border-slate-100 transition-colors hover:bg-slate-50/50 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                        >
                          <td className="py-4 pl-4">
                            <h5 className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                              {name || "Unnamed Document"}
                            </h5>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {issueDate || "---"}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {expiryDate || "---"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={clsx(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                                daysLeft === null
                                  ? "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20"
                                  : daysLeft < 0
                                    ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20"
                                    : daysLeft <= 30
                                      ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                                      : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                              )}
                            >
                              {daysLeft === null ? "---" : daysLeft}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {notes || "---"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={clsx(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                                calculatedStatus === "valid" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20" : 
                                calculatedStatus === "expired" ? "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20" : 
                                calculatedStatus === "renewal" ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20" : 
                                "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-400 dark:ring-slate-500/20"
                              )}
                            >
                              {calculatedStatus || "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button 
                                title="Edit Document" 
                                onClick={() => handleEdit(_id!)} 
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                              >
                                <FiEdit2 className="text-lg" />
                              </button>
                              <button 
                                title="Delete Document" 
                                onClick={() => handleDelete(_id!)} 
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-slate-800"
                              >
                                <FiTrash2 className="text-lg" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No documents yet. <button onClick={handleAddDocument} className="text-primary hover:underline">Add one</button>
                </div>
              )}
            <HandoverList 
              entityId={id} 
              entityName={employee?.name || "Employee"} 
              entityType="employee" 
            />
          </div>
        )}
      </div>
    </>
  );
};

export default SingleEmployee;
