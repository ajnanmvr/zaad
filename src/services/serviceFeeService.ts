import ServiceFeeMonth from "@/models/serviceFeeMonths";
import { PARTNER_ROLE } from "@/auth/roleConstants";
import { getDubaiDateParts } from "@/utils/dubaiTime";
import { ServiceError } from "./serviceError";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// The app started in July 2024 and was paid through September 2026. Every month up to that is paid by
// default; later months are unpaid until the developer records otherwise.
export const SERVICE_FEE_START_MONTH = "2024-07";
const INITIAL_PAID_UNTIL = "2026-09";
const UPCOMING_MONTHS = 3;

const monthIndex = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + (month - 1);
};

const formatMonth = (index: number) => {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
};

const currentMonthIndex = () => {
  const { year, month } = getDubaiDateParts();
  return year * 12 + (month - 1);
};

type MonthRecord = { paid: boolean; amount: number | null; paidOn: string; notes: string };

async function loadOverrides() {
  const rows = await ServiceFeeMonth.find({}).lean();
  const map = new Map<string, MonthRecord>();
  for (const row of rows as any[]) {
    map.set(row.month, {
      paid: Boolean(row.paid),
      amount: row.amount ?? null,
      paidOn: row.paidOn || "",
      notes: row.notes || "",
    });
  }
  return map;
}

function resolveMonth(month: string, overrides: Map<string, MonthRecord>): MonthRecord & { custom: boolean } {
  const override = overrides.get(month);
  if (override) return { ...override, custom: true };
  return { paid: monthIndex(month) <= monthIndex(INITIAL_PAID_UNTIL), amount: null, paidOn: "", notes: "", custom: false };
}

function summarize(overrides: Map<string, MonthRecord>) {
  const startIndex = monthIndex(SERVICE_FEE_START_MONTH);
  const nowIndex = currentMonthIndex();

  let firstUnpaid: number | null = null;
  let overdueMonths = 0;

  for (let index = startIndex; index <= nowIndex; index++) {
    if (!resolveMonth(formatMonth(index), overrides).paid) {
      overdueMonths += 1;
      if (firstUnpaid === null) firstUnpaid = index;
    }
  }

  // Paid-until is the last month of the unbroken paid run from the start (may run past today).
  let cursor = firstUnpaid ?? nowIndex + 1;
  if (firstUnpaid === null) {
    while (cursor - nowIndex < 600 && resolveMonth(formatMonth(cursor), overrides).paid) cursor += 1;
  }
  const paidUntil = cursor > startIndex ? formatMonth(cursor - 1) : null;

  return {
    paidUntil,
    overdue: overdueMonths > 0,
    overdueSince: firstUnpaid === null ? null : formatMonth(firstUnpaid),
    monthsOverdue: overdueMonths,
  };
}

export async function listServiceFeeMonths() {
  const overrides = await loadOverrides();
  const startIndex = monthIndex(SERVICE_FEE_START_MONTH);
  const nowIndex = currentMonthIndex();

  const months = [];
  for (let index = startIndex; index <= nowIndex + UPCOMING_MONTHS; index++) {
    const month = formatMonth(index);
    const record = resolveMonth(month, overrides);
    months.push({
      month,
      paid: record.paid,
      amount: record.amount,
      paidOn: record.paidOn,
      notes: record.notes,
      status: record.paid ? "paid" : index <= nowIndex ? "overdue" : "upcoming",
    });
  }

  return { months: months.reverse(), summary: summarize(overrides) };
}

export async function updateServiceFeeMonth(month: string, input: any, userId?: string) {
  if (!MONTH_RE.test(month) || monthIndex(month) < monthIndex(SERVICE_FEE_START_MONTH)) {
    throw new ServiceError(`Month must be YYYY-MM and not before ${SERVICE_FEE_START_MONTH}`, 400);
  }

  let amount: number | null = null;
  if (input?.amount !== undefined && input?.amount !== null && input?.amount !== "") {
    amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new ServiceError("Amount must be zero or greater", 400);
    }
  }

  await ServiceFeeMonth.findOneAndUpdate(
    { month },
    {
      month,
      paid: Boolean(input?.paid),
      amount,
      paidOn: String(input?.paidOn ?? "").trim(),
      notes: String(input?.notes ?? "").trim(),
      updatedBy: userId,
    },
    { upsert: true, new: true },
  );

  return listServiceFeeMonths();
}

export async function recordServiceFeeBatch(input: any, userId?: string) {
  const fromMonth = String(input?.fromMonth ?? "").trim();
  const count = Math.floor(Number(input?.months));
  if (!MONTH_RE.test(fromMonth) || monthIndex(fromMonth) < monthIndex(SERVICE_FEE_START_MONTH)) {
    throw new ServiceError(`Start month must be YYYY-MM and not before ${SERVICE_FEE_START_MONTH}`, 400);
  }
  if (!Number.isFinite(count) || count < 1 || count > 60) {
    throw new ServiceError("Number of months must be between 1 and 60", 400);
  }

  let totalCents: number | null = null;
  if (input?.totalAmount !== undefined && input?.totalAmount !== null && input?.totalAmount !== "") {
    const total = Number(input.totalAmount);
    if (!Number.isFinite(total) || total < 0) {
      throw new ServiceError("Amount must be zero or greater", 400);
    }
    totalCents = Math.round(total * 100);
  }

  const paidOn = String(input?.paidOn ?? "").trim();
  const baseNotes = String(input?.notes ?? "").trim();
  const startIndex = monthIndex(fromMonth);
  const batchNote = `Batch payment: ${count} month${count === 1 ? "" : "s"} (${fromMonth} to ${formatMonth(startIndex + count - 1)})`;
  const notes = baseNotes ? `${baseNotes} · ${batchNote}` : batchNote;

  // Split the total evenly across the months in cents; the last month absorbs any remainder.
  const baseCents = totalCents === null ? null : Math.floor(totalCents / count);

  const operations = Array.from({ length: count }, (_, offset) => {
    const month = formatMonth(startIndex + offset);
    let amount: number | null = null;
    if (totalCents !== null && baseCents !== null) {
      const cents = offset === count - 1 ? totalCents - baseCents * (count - 1) : baseCents;
      amount = cents / 100;
    }
    return {
      updateOne: {
        filter: { month },
        update: { $set: { month, paid: true, amount, paidOn, notes, updatedBy: userId } },
        upsert: true,
      },
    };
  });

  await ServiceFeeMonth.bulkWrite(operations);
  return listServiceFeeMonths();
}

export async function getServiceFeeStatus(role?: string) {
  const summary = summarize(await loadOverrides());
  return {
    ...summary,
    // Only partners are shown the warning.
    visible: summary.overdue && (role || "").toLowerCase() === PARTNER_ROLE,
  };
}
