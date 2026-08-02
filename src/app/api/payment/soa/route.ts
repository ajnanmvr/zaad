import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import Records from "@/models/records";
import { Entity } from "@/models/entities";
import "@/models/paymentTemplates";
import mongoose from "mongoose";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { DUBAI_TIME_ZONE } from "@/utils/dubaiTime";

export const dynamic = "force-dynamic";

function dubaiDateStr(date: Date) {
  const d = toZonedTime(date, DUBAI_TIME_ZONE);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const sp = request.nextUrl.searchParams;
    const entityType = sp.get("entityType");
    const entityId = sp.get("entityId");
    const dateFrom = sp.get("from") || null;
    const dateTo = sp.get("to") || null;

    if (!entityType || !entityId) {
      return Response.json({ error: "entityType and entityId are required" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return Response.json({ error: "Invalid entityId" }, { status: 400 });
    }

    const entity = await Entity.findById(entityId).lean() as any;
    if (!entity) {
      return Response.json({ error: "Entity not found" }, { status: 404 });
    }

    const entityObjectId = new mongoose.Types.ObjectId(entityId);
    const baseFilter: Record<string, any> = {
      deletedAt: null,
      entity: entityObjectId,
      recordKind: { $nin: ["liability", "office_records"] },
    };

    // Period filter
    const periodFilter: Record<string, any> = { ...baseFilter };
    if (dateFrom || dateTo) {
      periodFilter.createdAt = {} as Record<string, any>;
      if (dateFrom) {
        periodFilter.createdAt.$gte = fromZonedTime(`${dateFrom}T00:00:00`, DUBAI_TIME_ZONE);
      }
      if (dateTo) {
        periodFilter.createdAt.$lte = fromZonedTime(`${dateTo}T23:59:59`, DUBAI_TIME_ZONE);
      }
    }

    // Fetch period records oldest-first
    const periodRecords = await Records.find(periodFilter)
      .sort({ createdAt: 1, _id: 1 })
      .populate("method", "method")
      .lean() as any[];

    // Opening balance = sum of all records before dateFrom
    let openingBalance = 0;
    if (dateFrom) {
      const agg = await Records.aggregate([
        {
          $match: {
            ...baseFilter,
            createdAt: { $lt: fromZonedTime(`${dateFrom}T00:00:00`, DUBAI_TIME_ZONE) },
          },
        },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: { $cond: [{ $eq: ["$type", "income"] }, { $ifNull: ["$amount", 0] }, 0] },
            },
            totalExpense: {
              $sum: {
                $cond: [
                  { $eq: ["$type", "expense"] },
                  { $add: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$serviceFee", 0] }] },
                  0,
                ],
              },
            },
          },
        },
      ]);
      if (agg.length > 0) {
        // expense = charges to client (debit), income = payments from client (credit)
        openingBalance = Number((Number(agg[0].totalExpense || 0) - Number(agg[0].totalIncome || 0)).toFixed(2));
      }
    }

    // ── Aging calculation ────────────────────────────────────────────────
    // Step 1: get the true all-time balance via aggregation (reliable)
    const allTimeAgg = await Records.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, { $ifNull: ["$amount", 0] }, 0] },
          },
          totalExpense: {
            $sum: {
              $cond: [
                { $eq: ["$type", "expense"] },
                { $add: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$serviceFee", 0] }] },
                0,
              ],
            },
          },
        },
      },
    ]);
    const allTimeOutstanding = allTimeAgg.length > 0
      ? Number((Number(allTimeAgg[0].totalExpense || 0) - Number(allTimeAgg[0].totalIncome || 0)).toFixed(2))
      : 0;

    // Step 2: if outstanding <= 0 (overpaid or settled), aging is all zeros.
    // Step 3: if outstanding > 0, distribute it across age buckets starting from
    //         the NEWEST expense records (charges to client). Under FIFO payment
    //         application, oldest charges are cleared first, so the remaining
    //         outstanding sits in the newest charges.
    const today = new Date();
    const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
    if (allTimeOutstanding > 0) {
      const incomeRecords = await Records.find({ ...baseFilter, type: "expense" })
        .sort({ createdAt: -1, _id: -1 })
        .select("amount serviceFee createdAt")
        .lean() as any[];

      let remaining = allTimeOutstanding;
      for (const rec of incomeRecords) {
        if (remaining <= 0) break;
        const chunk = Math.min(Number(rec.amount || 0) + Number(rec.serviceFee || 0), remaining);
        if (chunk <= 0) continue;
        const daysOld = Math.floor((today.getTime() - new Date(rec.createdAt).getTime()) / 86_400_000);
        if (daysOld <= 30)       aging.current += chunk;
        else if (daysOld <= 60)  aging.days30  += chunk;
        else if (daysOld <= 90)  aging.days60  += chunk;
        else if (daysOld <= 120) aging.days90  += chunk;
        else                     aging.over90  += chunk;
        remaining -= chunk;
      }
      (Object.keys(aging) as (keyof typeof aging)[]).forEach(
        (k) => { aging[k] = Number(aging[k].toFixed(2)); }
      );
    }
    // ──────────────────────────────────────────────────────────────────────

    let runningBalance = openingBalance;
    let totalDebits = 0;
    let totalCredits = 0;

    const rows = periodRecords.map((rec: any) => {
      const amount = Number(rec.amount || 0);
      const serviceFee = Number(rec.serviceFee || 0);
      const isIncome = rec.type === "income";

      let debit: number | undefined;
      let credit: number | undefined;

      if (isIncome) {
        // income = payment received from client → Credit column
        credit = Number(amount.toFixed(2));
        totalCredits += credit;
        runningBalance = Number((runningBalance - credit).toFixed(2));
      } else {
        // expense = charge to client → Debit column
        debit = Number((amount + serviceFee).toFixed(2));
        totalDebits += debit;
        runningBalance = Number((runningBalance + debit).toFixed(2));
      }

      const refParts = [rec.suffix, rec.number].filter(Boolean);

      return {
        date: dubaiDateStr(new Date(rec.createdAt)),
        jobNo: rec.number ? String(rec.number) : null,
        refNo: refParts.length > 0 ? refParts.join("") : null,
        transaction: isIncome ? "Payment" : "Invoice",
        particular: rec.particular || "",
        paymentMethod: rec.method?.method || null,
        remarks: rec.remarks || null,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    const now = new Date();
    const nowDubai = toZonedTime(now, DUBAI_TIME_ZONE);
    const pad = (n: number) => String(n).padStart(2, "0");
    const statementNo = `SOA-${nowDubai.getFullYear()}-${pad(nowDubai.getMonth() + 1)}${pad(nowDubai.getDate())}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    return Response.json(
      {
        entity: {
          name: entity.name,
          phone: entity.phone1 || entity.phone2 || null,
          email: entity.email || null,
          licenseNo: entity.licenseNo || null,
        },
        entityType,
        statementNo,
        statementDate: dubaiDateStr(now),
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        openingBalance,
        rows,
        totalDebits: Number(totalDebits.toFixed(2)),
        totalCredits: Number(totalCredits.toFixed(2)),
        closingBalance: runningBalance,
        aging,
      },
      { status: 200 },
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to generate statement of account") },
      { status },
    );
  }
}
