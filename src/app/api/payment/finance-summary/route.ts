import connect from "@/db/mongo";
import Records from "@/models/records";
import { requirePermission } from "@/auth/guards";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";
import { getDubaiDateParts } from "@/utils/dubaiTime";
import { fromZonedTime } from "date-fns-tz";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const DUBAI_TZ = "Asia/Dubai";

function getTodayDubaiRange() {
  const { year, month, day } = getDubaiDateParts();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStart = fromZonedTime(`${year}-${pad(month)}-${pad(day)}T00:00:00`, DUBAI_TZ);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const tomorrowStart = fromZonedTime(
    `${nextDay.getUTCFullYear()}-${pad(nextDay.getUTCMonth() + 1)}-${pad(nextDay.getUTCDate())}T00:00:00`,
    DUBAI_TZ,
  );
  return { todayStart, tomorrowStart };
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "payments.view.records-summary");

    const { todayStart, tomorrowStart } = getTodayDubaiRange();

    const [totalTransactions, todayServiceFeeResult] = await Promise.all([
      Records.countDocuments({ deletedAt: null }),
      Records.aggregate([
        {
          $match: {
            deletedAt: null,
            createdAt: { $gte: todayStart, $lt: tomorrowStart },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$serviceFee" },
          },
        },
      ]),
    ]);

    const todayProfit = Number(todayServiceFeeResult[0]?.total || 0);

    return Response.json(
      {
        summary: {
          totalTransactions,
          todayProfit,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    return Response.json(
      { error: getServiceErrorMessage(error, "Failed to load finance summary") },
      { status },
    );
  }
}
