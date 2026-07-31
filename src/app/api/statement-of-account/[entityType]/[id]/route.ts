import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Entity from "@/models/entities";
import { findRecords } from "@/repositories/paymentRepository";
import { PAYMENT_POPULATE_FIELDS } from "@/app/api/payment/utils";
import { DUBAI_TIME_ZONE, formatDubaiDate, getDubaiDateParts } from "@/utils/dubaiTime";
import { fromZonedTime } from "date-fns-tz";
import { NextRequest } from "next/server";

type EntityType = "company" | "employee" | "individual";

function parseEntityType(value: string): EntityType | null {
  return value === "company" || value === "employee" || value === "individual" ? value : null;
}

function formatInputDate(value: Date) {
  const { year, month, day } = getDubaiDateParts(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildRangeDate(value: string, endOfDay = false) {
  return fromZonedTime(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`, DUBAI_TIME_ZONE);
}

function applyRecordEffect(balance: number, record: any) {
  const amount = Number(record?.amount || 0);
  const serviceFee = Number(record?.serviceFee || 0);

  if (record?.type === "expense") {
    return balance + amount + serviceFee;
  }

  if (record?.type === "income") {
    return balance - amount;
  }

  return balance;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; id: string } },
) {
  try {
    await connect();
    await requirePermission(request, "payments.read");

    const entityType = parseEntityType(params.entityType);
    if (!entityType) {
      return Response.json({ error: "Invalid entity type" }, { status: 400 });
    }

    const entity = await Entity.findById(params.id).lean<any>();
    if (!entity) {
      return Response.json({ error: "Entity not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode") === "custom" ? "custom" : "all-time";
    const from = String(searchParams.get("from") || "").trim();
    const to = String(searchParams.get("to") || "").trim();
    const scope = searchParams.get("scope");

    const employeeIds =
      entityType === "company"
        ? await Entity.find({ company: params.id, entityType: "employee", published: true })
            .select("_id")
            .lean()
            .then((rows) => rows.map((row: any) => String(row._id)))
        : [];

    const entityIds =
      entityType === "company"
        ? scope === "employees"
          ? employeeIds
          : scope === "mixed"
            ? [params.id, ...employeeIds]
            : [params.id]
        : [params.id];

    const activeEntityIds = Array.from(new Set(entityIds.filter(Boolean)));
    const baseQuery: Record<string, any> = {
      deletedAt: null,
      recordKind: { $ne: "liability" },
      entity: { $in: activeEntityIds },
    };

    let openingBalance = 0;
    let periodFrom = "";
    let periodTo = "";

    if (mode === "custom") {
      if (!from || !to || from > to) {
        return Response.json({ error: "Invalid statement range" }, { status: 400 });
      }

      const statementStart = buildRangeDate(from, false);
      const statementEnd = buildRangeDate(to, true);
      periodFrom = from;
      periodTo = to;

      const openingRecords = await findRecords(
        {
          ...baseQuery,
          createdAt: { $lt: statementStart },
        },
        {
          populate: PAYMENT_POPULATE_FIELDS,
          sort: { createdAt: 1, _id: 1 },
          lean: true,
        },
      );

      openingBalance = openingRecords.reduce((balance, record) => applyRecordEffect(balance, record), 0);

      const records = await findRecords(
        {
          ...baseQuery,
          createdAt: { $gte: statementStart, $lte: statementEnd },
        },
        {
          populate: PAYMENT_POPULATE_FIELDS,
          sort: { createdAt: 1, _id: 1 },
          lean: true,
        },
      );

      const rows = records.map((record: any) => {
        const debit = record?.type === "expense" ? Number((Number(record?.amount || 0) + Number(record?.serviceFee || 0)).toFixed(2)) : 0;
        const credit = record?.type === "income" ? Number(Number(record?.amount || 0).toFixed(2)) : 0;
        openingBalance = Number((openingBalance + debit - credit).toFixed(2));

        return {
          date: formatDubaiDate(record?.createdAt || new Date(), { day: "2-digit", month: "2-digit", year: "numeric" }),
          refNo: `${record?.suffix || ""}${record?.number || ""}` || "---",
          jobNo: "---",
          transaction: record?.type === "income" ? "Payment" : "Invoice",
          particulars: String(record?.particular || "---"),
          debit,
          credit,
          balance: openingBalance,
        };
      });

      const totalDebits = Number(rows.reduce((sum, row) => sum + Number(row.debit || 0), 0).toFixed(2));
      const totalCredits = Number(rows.reduce((sum, row) => sum + Number(row.credit || 0), 0).toFixed(2));
      const closingBalance = Number((rows.length ? rows[rows.length - 1].balance : Number(openingBalance.toFixed(2))).toFixed(2));

      return Response.json({
        success: true,
        statement: {
          statementNo: `SOA-${formatInputDate(new Date()).replace(/-/g, "")}`,
          statementDate: formatDubaiDate(new Date(), { day: "2-digit", month: "2-digit", year: "numeric" }),
          periodLabel: `${from} - ${to}`,
          currency: "AED",
          entity: {
            id: params.id,
            entityType,
            name: String(entity?.name || "Client"),
            color: entity?.color,
            licenseNo: entityType === "company" ? entity?.licenseNo || "---" : "---",
            phone1: entity?.phone1 || "---",
            phone2: entity?.phone2 || "---",
            email: entity?.email || "---",
            remarks: entity?.remarks || "",
            company: entity?.company,
            emiratesId: entity?.emiratesId || "---",
            nationality: entity?.nationality || "---",
            designation: entity?.designation || "---",
          },
          summary: {
            openingBalance: Number((rows.length ? rows[0].balance - rows[0].debit + rows[0].credit : openingBalance).toFixed(2)),
            totalDebits,
            totalCredits,
            closingBalance,
          },
          aging: {
            current: closingBalance,
            days30: 0,
            days60: 0,
            days90: 0,
            over90: 0,
          },
          rows: [
            {
              date: periodFrom,
              refNo: "OB",
              jobNo: "-",
              transaction: "Opening Balance",
              particulars: "Balance Carried Forward",
              debit: 0,
              credit: 0,
              balance: Number((rows.length ? rows[0].balance - rows[0].debit + rows[0].credit : openingBalance).toFixed(2)),
            },
            ...rows,
          ],
          generatedAt: new Date().toISOString(),
          periodFrom,
          periodTo,
        },
      });
    }

    const records = await findRecords(
      {
        ...baseQuery,
      },
      {
        populate: PAYMENT_POPULATE_FIELDS,
        sort: { createdAt: 1, _id: 1 },
        lean: true,
      },
    );

    const rows = records.map((record: any) => {
      const debit = record?.type === "expense" ? Number((Number(record?.amount || 0) + Number(record?.serviceFee || 0)).toFixed(2)) : 0;
      const credit = record?.type === "income" ? Number(Number(record?.amount || 0).toFixed(2)) : 0;
      openingBalance = Number((openingBalance + debit - credit).toFixed(2));

      return {
        date: formatDubaiDate(record?.createdAt || new Date(), { day: "2-digit", month: "2-digit", year: "numeric" }),
        refNo: `${record?.suffix || ""}${record?.number || ""}` || "---",
        jobNo: "---",
        transaction: record?.type === "income" ? "Payment" : "Invoice",
        particulars: String(record?.particular || "---"),
        debit,
        credit,
        balance: openingBalance,
      };
    });

    const totalDebits = Number(rows.reduce((sum, row) => sum + Number(row.debit || 0), 0).toFixed(2));
    const totalCredits = Number(rows.reduce((sum, row) => sum + Number(row.credit || 0), 0).toFixed(2));

    return Response.json({
      success: true,
      statement: {
        statementNo: `SOA-${formatInputDate(new Date()).replace(/-/g, "")}`,
        statementDate: formatDubaiDate(new Date(), { day: "2-digit", month: "2-digit", year: "numeric" }),
        periodLabel: "All Time",
        currency: "AED",
        entity: {
          id: params.id,
          entityType,
          name: String(entity?.name || "Client"),
          color: entity?.color,
          licenseNo: entityType === "company" ? entity?.licenseNo || "---" : "---",
          phone1: entity?.phone1 || "---",
          phone2: entity?.phone2 || "---",
          email: entity?.email || "---",
          remarks: entity?.remarks || "",
          company: entity?.company,
          emiratesId: entity?.emiratesId || "---",
          nationality: entity?.nationality || "---",
          designation: entity?.designation || "---",
        },
        summary: {
          openingBalance: 0,
          totalDebits,
          totalCredits,
          closingBalance: Number((totalDebits - totalCredits).toFixed(2)),
        },
        aging: {
          current: Number((totalDebits - totalCredits).toFixed(2)),
          days30: 0,
          days60: 0,
          days90: 0,
          over90: 0,
        },
        rows: [
          {
            date: records[0] ? formatDubaiDate(records[0].createdAt || new Date(), { day: "2-digit", month: "2-digit", year: "numeric" }) : formatDubaiDate(new Date(), { day: "2-digit", month: "2-digit", year: "numeric" }),
            refNo: "OB",
            jobNo: "-",
            transaction: "Opening Balance",
            particulars: "Balance Carried Forward",
            debit: 0,
            credit: 0,
            balance: 0,
          },
          ...rows,
        ],
        generatedAt: new Date().toISOString(),
        periodFrom: records[0] ? formatInputDate(new Date(records[0].createdAt)) : "",
        periodTo: records[records.length - 1] ? formatInputDate(new Date(records[records.length - 1].createdAt)) : "",
      },
    });
  } catch (error) {
    console.error("Statement of account fetch error:", error);
    return Response.json({ error: "Failed to generate statement of account" }, { status: 500 });
  }
}