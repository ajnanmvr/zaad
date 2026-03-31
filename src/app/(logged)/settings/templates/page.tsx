"use client";

import { FormEvent, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useUserContext } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiFileText, FiLock, FiPlus, FiTrash2, FiAlertCircle } from "react-icons/fi";
import clsx from "clsx";

type DocumentTemplate = {
  _id: string;
  name: string;
  createdAt: string;
};

type CredentialTemplate = {
  _id: string;
  platform: string;
  createdAt: string;
};

const TemplatesPage = () => {
  const { user } = useUserContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Document template state
  const [documentName, setDocumentName] = useState("");
  const [credentialPlatform, setCredentialPlatform] = useState("");
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [loadingCredential, setLoadingCredential] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canManageTemplates =
    Array.isArray(user?.permissions) && user.permissions.includes("entities.write");

  // Fetch document templates
  const documentQuery = useQuery({
    queryKey: ["document-templates"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", {
        params: { type: "document" },
      });
      
      // Convert options to full template format for display
      const templates = data.options.map((opt: any) => ({
        _id: opt.id,
        name: opt.name,
        createdAt: new Date().toISOString(),
      }));
      
      return templates as DocumentTemplate[];
    },
    enabled: canManageTemplates,
  });

  // Fetch credential templates
  const credentialQuery = useQuery({
    queryKey: ["credential-templates"],
    queryFn: async () => {
      const { data } = await axios.get("/api/templates", {
        params: { type: "credential" },
      });
      
      // Convert options to full template format for display
      const templates = data.options.map((opt: any) => ({
        _id: opt.id,
        platform: opt.platform,
        createdAt: new Date().toISOString(),
      }));
      
      return templates as CredentialTemplate[];
    },
    enabled: canManageTemplates,
  });

  if (user && !canManageTemplates) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <Breadcrumb pageName="Template Management" />
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-8 dark:border-rose-800 dark:bg-rose-500/10">
          <h3 className="mb-2 text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <FiAlertCircle className="text-xl" />
            Access Denied
          </h3>
          <p className="text-rose-600 dark:text-rose-300">
            You need the <code className="bg-rose-200 px-2 py-1 rounded dark:bg-rose-900">entities.write</code> permission to manage templates.
          </p>
        </div>
      </div>
    );
  }

  const documentTemplates = documentQuery.data || [];
  const credentialTemplates = credentialQuery.data || [];

  const handleAddDocumentTemplate = async (e: FormEvent) => {
    e.preventDefault();

    if (!documentName.trim()) {
      toast.error("Please enter a document name");
      return;
    }

    setLoadingDocument(true);
    try {
      await axios.post("/api/templates", {
        type: "document",
        name: documentName.trim(),
      });

      toast.success("Document template added successfully");
      setDocumentName("");
      await queryClient.invalidateQueries({ queryKey: ["document-templates"] });
    } catch (error: any) {
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);
      if (error.response?.status === 409) {
        toast.error("Document template with this name already exists");
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Permission denied. You need entities.write permission");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to add document template");
      }
      console.error("Error adding document template:", error);
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleAddCredentialTemplate = async (e: FormEvent) => {
    e.preventDefault();

    if (!credentialPlatform.trim()) {
      toast.error("Please enter a platform name");
      return;
    }

    setLoadingCredential(true);
    try {
      await axios.post("/api/templates", {
        type: "credential",
        platform: credentialPlatform.trim(),
      });

      toast.success("Credential template added successfully");
      setCredentialPlatform("");
      await queryClient.invalidateQueries({ queryKey: ["credential-templates"] });
    } catch (error: any) {
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);
      if (error.response?.status === 409) {
        toast.error("Credential template with this platform already exists");
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Permission denied. You need entities.write permission");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to add credential template");
      }
      console.error("Error adding credential template:", error);
    } finally {
      setLoadingCredential(false);
    }
  };

  const handleDeleteDocument = async (templateId: string) => {
    if (!window.confirm("Are you sure you want to delete this document template?")) {
      return;
    }

    setDeletingId(templateId);
    try {
      await axios.delete("/api/templates", {
        params: { id: templateId, type: "document" },
      });

      toast.success("Document template deleted successfully");
      await queryClient.invalidateQueries({ queryKey: ["document-templates"] });
    } catch (error) {
      console.error("Error deleting document template:", error);
      toast.error("Failed to delete document template");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCredential = async (templateId: string) => {
    if (!window.confirm("Are you sure you want to delete this credential template?")) {
      return;
    }

    setDeletingId(templateId);
    try {
      await axios.delete("/api/templates", {
        params: { id: templateId, type: "credential" },
      });

      toast.success("Credential template deleted successfully");
      await queryClient.invalidateQueries({ queryKey: ["credential-templates"] });
    } catch (error: any) {
      console.error("Error deleting credential template:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to delete credential template");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <Breadcrumb pageName="Template Management" />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Document Templates */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center gap-3">
            <FiFileText className="text-2xl text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">
              Document Templates
            </h3>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Add Document Template Form */}
            <form onSubmit={handleAddDocumentTemplate} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g., Passport, Emirates ID, Visa"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 placeholder-slate-500 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={loadingDocument}
                    className={clsx(
                      "flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white transition-colors",
                      loadingDocument
                        ? "bg-emerald-400 cursor-not-allowed"
                        : "bg-emerald-500 hover:bg-emerald-600"
                    )}
                  >
                    <FiPlus className="text-lg" />
                    Add
                  </button>
                </div>
              </div>
            </form>

            {/* Document Templates List */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Existing Templates
              </h4>
              {documentTemplates.length > 0 ? (
                <div className="space-y-2">
                  {documentTemplates.map((template) => (
                    <div
                      key={template._id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {template.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Created: {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(template._id)}
                        disabled={deletingId === template._id}
                        className="ml-3 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:bg-slate-700"
                        title="Delete template"
                      >
                        <FiTrash2 className="text-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <FiAlertCircle className="mx-auto text-3xl text-slate-400 dark:text-slate-500 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No document templates yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Credential Templates */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800 flex items-center gap-3">
            <FiLock className="text-2xl text-blue-500" />
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">
              Credential Templates
            </h3>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Add Credential Template Form */}
            <form onSubmit={handleAddCredentialTemplate} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Platform Name <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={credentialPlatform}
                    onChange={(e) => setCredentialPlatform(e.target.value)}
                    placeholder="e.g., Gmail, Outlook, GitHub"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-700 placeholder-slate-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={loadingCredential}
                    className={clsx(
                      "flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium text-white transition-colors",
                      loadingCredential
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600"
                    )}
                  >
                    <FiPlus className="text-lg" />
                    Add
                  </button>
                </div>
              </div>
            </form>

            {/* Credential Templates List */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Existing Templates
              </h4>
              {credentialTemplates.length > 0 ? (
                <div className="space-y-2">
                  {credentialTemplates.map((template) => (
                    <div
                      key={template._id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {template.platform}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Created: {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCredential(template._id)}
                        disabled={deletingId === template._id}
                        className="ml-3 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:bg-slate-700"
                        title="Delete template"
                      >
                        <FiTrash2 className="text-lg" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
                  <FiAlertCircle className="mx-auto text-3xl text-slate-400 dark:text-slate-500 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No credential templates yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 to-emerald-50 p-6 dark:border-slate-800 dark:from-blue-500/10 dark:to-emerald-500/10 sm:p-8">
        <h3 className="mb-3 text-lg font-bold text-slate-800 dark:text-white">
          About Template Management
        </h3>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex gap-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
            <span>
              <strong>Document Templates</strong> are used when employees add documents like passports, visas, 
              and certifications to their profiles.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">•</span>
            <span>
              <strong>Credential Templates</strong> are used for storing platform credentials (e.g., email accounts, 
              software accounts) for employees.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-400">•</span>
            <span>
              Templates are pre-defined options shown in dropdown menus throughout the application.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-400">•</span>
            <span>
              Deleting a template will not affect existing documents or credentials using that template.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TemplatesPage;
