"use server";

import "server-only";

import { cookies } from "next/headers";
import { InvoiceService } from "@/services/invoice.service";
import { requireAuth } from "@/actions/_auth";

const JWT_SECRET = process.env.JWT_SECRET; // kept for potential cookie scenarios

// ============================================
// INVOICE ACTIONS
// ============================================

export async function createInvoiceAction(payload: any) {
  await requireAuth();
  return InvoiceService.createInvoice(payload);
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
  await requireAuth();
  await InvoiceService.updateInvoice(id, payload);
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
