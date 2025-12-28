"use server";

import "server-only";

import { cookies } from "next/headers";
import { InvoiceService } from "@/services/invoice.service";
import { getSecureUser } from "@/helpers/getSecureUser";
import { requireAuth } from "@/actions/_auth";

const JWT_SECRET = process.env.JWT_SECRET; // kept for potential cookie scenarios

// ============================================
// INVOICE ACTIONS
// ============================================

export async function createInvoiceAction(payload: any) {
  const user = await getSecureUser();
  // Remove any frontend-provided user data and use server-side authenticated user
  const { createdBy: _ignored, ...safePayload } = payload;
  return InvoiceService.createInvoice({
    ...safePayload,
    createdBy: user.id,
  });
}

export async function listInvoicesAction(search: string | null, page: number) {
  await requireAuth();
  return InvoiceService.listInvoices(search, page);
}

export async function getInvoiceAction(id: string, editMode: boolean = false) {
  await requireAuth();
  return InvoiceService.getInvoiceById(id, editMode);
}

export async function updateInvoiceAction(id: string, payload: any) {
  const user = await getSecureUser();
  // Remove any frontend-provided user data and use server-side authenticated user
  const { editedBy: _ignored, ...safePayload } = payload;
  await InvoiceService.updateInvoice(id, {
    ...safePayload,
    editedBy: user.id,
  });
  return { success: true };
}

export async function deleteInvoiceAction(id: string) {
  await requireAuth();
  await InvoiceService.deleteInvoice(id);
  return { success: true };
}

export async function getNextInvoiceNoAction() {
  await requireAuth();
  return InvoiceService.getNextInvoiceNo();
}
