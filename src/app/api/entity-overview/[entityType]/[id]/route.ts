import { NextRequest } from "next/server";

import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import Company from "@/models/companies";
import Employee from "@/models/employees";
import Individual from "@/models/individuals";
import EntityDocument from "@/models/entityDocuments";
import EntityCredential from "@/models/entityCredentials";
import PhysicalHandover from "@/models/physicalHandover";
import Records from "@/models/records";
import Invoice from "@/models/invoice";
import Task from "@/models/tasks";

type EntityTypeParam = "company" | "employee" | "individual";

export async function GET(
  request: NextRequest,
  { params }: { params: { entityType: string; id: string } },
) {
  try {
    await connect();
    await requirePermission(request, "entities.read");

    const entityType = params.entityType as EntityTypeParam;
    const entityId = params.id;

    if (
      entityType !== "company" &&
      entityType !== "employee" &&
      entityType !== "individual"
    ) {
      return Response.json(
        { message: "Unsupported entity type" },
        { status: 400 },
      );
    }

    const entityModel =
      entityType === "company"
        ? Company
        : entityType === "employee"
          ? Employee
          : Individual;
    const entityQuery = entityModel
      .findById(entityId)
      .select("name email phone1 phone2 color company published");

    if (entityType === "employee") {
      entityQuery.populate("company", "name color");
    }

    const entity = await entityQuery;

    if (!entity) {
      return Response.json({ message: "Entity not found" }, { status: 404 });
    }

    const [
      documentsCount,
      credentialsCount,
      handoversCount,
      recordsCount,
      employeesCount,
      tasksCount,
    ] = await Promise.all([
      EntityDocument.countDocuments({ entity: entityId }),
      EntityCredential.countDocuments({ entity: entityId }),
      PhysicalHandover.countDocuments({ entity: entityId }),
      Records.countDocuments({
        published: true,
        ...(entityType === "company"
          ? { company: entityId }
          : entityType === "employee"
            ? { employee: entityId }
            : { _id: null }),
      }),
      entityType === "company"
        ? Employee.countDocuments({
            published: true,
            company: entityId,
            entityType: "employee",
          })
        : Promise.resolve(0),
      Task.countDocuments({
        published: true,
        linkedTargets: {
          $elemMatch: {
            targetType: entityType,
            targetId: entityId,
          },
        },
      }),
    ]);

    const invoicesCount = await Invoice.countDocuments({
      published: true,
      client: entity.name,
    });

    return Response.json(
      {
        data: {
          entity: {
            id: entity._id.toString(),
            name: entity.name,
            entityType,
            email: entity.email || "",
            phone1: entity.phone1 || "",
            phone2: entity.phone2 || "",
            color: entity.color || "",
            published: (entity as any).published !== false,
            company:
              entityType === "employee" && (entity as any).company
                ? {
                    id: (entity as any).company._id?.toString() || "",
                    name: (entity as any).company.name || "",
                    color: (entity as any).company.color || "",
                  }
                : undefined,
          },
          counts: {
            details: 1,
            documents: documentsCount,
            credentials: credentialsCount,
            handovers: handoversCount,
            tasks: tasksCount,
            employees: employeesCount,
            invoices: invoicesCount,
            records: recordsCount,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching entity overview:", error);
    return Response.json(
      { message: "Error fetching entity overview" },
      { status: 500 },
    );
  }
}
