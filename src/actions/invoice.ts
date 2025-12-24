"use server";

import "server-only";

import connect from "@/db/mongo";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { InvoiceService } from "@/services/invoice.service";

const JWT_SECRET = process.env.JWT_SECRET;

async function requireAuth() {
  const token = cookies().get("auth")?.value;
  if (!token || !JWT_SECRET) throw new Error("Not authenticated");
  await connect();
  jwt.verify(token, JWT_SECRET);
  return true;
}

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
