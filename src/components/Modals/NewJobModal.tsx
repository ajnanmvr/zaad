"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";
import EntitySearchPicker, { type PickedEntity } from "@/components/common/EntitySearchPicker";
import JobCategoryTitleFields from "@/components/common/JobCategoryTitleFields";
import type { JobCategory } from "@/config/jobTitleSuggestions";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300";

export default function NewJobModal({
  defaultClient,
  onClose,
  onCreated,
}: {
  defaultClient?: PickedEntity | null;
  onClose: () => void;
  onCreated: (job: { id: string; jobId: string; title: string }) => void;
}) {
  const [client, setClient] = useState<PickedEntity | null>(defaultClient || null);
  const [category, setCategory] = useState<JobCategory | "">("");
  const [title, setTitle] = useState("");
  const [jobId, setJobId] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    // The modal is rendered inside the record form's tree; never submit the outer form.
    e.preventDefault();
    e.stopPropagation();
    if (!client) {
      toast.error("Select a client for this job");
      return;
    }
    if (!category) {
      toast.error("Select a job type (License or Visa)");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post("/api/jobs", { title, description, category, jobId: jobId || undefined, entity: client.id });
      toast.success(`Job ${res.data.data.jobId} created`);
      onCreated(res.data.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to create job");
    } finally {
      setSaving(false);
    }
  };

  // Portal avoids nesting this <form> inside the record form.
  return createPortal(
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">New Job</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <FiX />
          </button>
        </div>
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          The Job ID is generated for you (you can edit it) and will be filled into the record.
        </p>
        <div>
          <label className={labelClass}>Client</label>
          <EntitySearchPicker value={client} onChange={setClient} />
        </div>
        <JobCategoryTitleFields
          category={category}
          onCategoryChange={setCategory}
          title={title}
          onTitleChange={setTitle}
          jobId={jobId}
          onJobIdChange={setJobId}
          autoFocusTitle
        />
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="Optional details"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600 dark:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Job"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
