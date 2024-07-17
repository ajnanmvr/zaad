import connect from "@/db/connect";
import Company from "@/models/companies";
import Employee from "@/models/employees";
import Records from "@/models/records";
import { TRecordData } from "@/types/records";
import { TCompanyData, TEmployeeData } from "@/types/types";
import processCompanies from "@/helpers/processCompanies";
import processEmployees from "@/helpers/processEmployees";
import { NextRequest } from "next/server";
import { filterData } from "@/utils/filterData";

connect();

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filter = filterData(searchParams,false);
  try {
    const [companies, employees, allRecords]: [
      TCompanyData[],
      TEmployeeData[],
      TRecordData[],
    ] = await Promise.all([
      Company.find({ published: true }),
      Employee.find({ published: true }),
      Records.find(filter),
    ]);

    const companyRecords = allRecords.filter(
      (record) => record.company && record.published
    );
    const employeeRecords = allRecords.filter(
      (record) => record.employee && record.published
    );

    const {
      over0balanceCompanies,
      under0balanceCompanies,
      totalProfitAllCompanies,
      totalToGiveCompanies,
      totalToGetCompanies,
    } = processCompanies(companies, companyRecords);

    const {
      over0balanceEmployees,
      under0balanceEmployees,
      totalProfitAllEmployees,
      totalToGiveEmployees,
      totalToGetEmployees,
    } = processEmployees(employees, employeeRecords);

    const profit = totalProfitAllEmployees + totalProfitAllCompanies;
    const totalToGive = totalToGiveCompanies + totalToGiveEmployees;
    const totalToGet = totalToGetCompanies + totalToGetEmployees;

    return Response.json(
      {
        over0balanceCompanies,
        under0balanceCompanies,
        totalProfitAllCompanies,
        totalToGiveCompanies,
        totalToGetCompanies,
        over0balanceEmployees,
        under0balanceEmployees,
        totalProfitAllEmployees,
        totalToGiveEmployees,
        totalToGetEmployees,
        profit,
        totalToGive,
        totalToGet,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
