import connect from "@/db/mongo";
import { requireAnyPermission, requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import generateEntityColor from "@/utils/generateEntityColor";
import DocumentTemplate from "@/models/documentTemplates";
import CredentialTemplate from "@/models/credentialTemplates";
import PaymentTemplate from "@/models/paymentTemplates";
import PaymentStatusTemplate from "@/models/paymentStatusTemplates";
import EntityDocument from "@/models/entityDocuments";
import EntityCredential from "@/models/entityCredentials";
import Records from "@/models/records";
import { DEFAULT_PAYMENT_TEMPLATE_ICON, PAYMENT_TEMPLATE_ICON_KEYS } from "@/config/templateVisuals";
import { getServiceErrorMessage, getServiceErrorStatus } from "@/services/serviceError";

function normalizeHexColor(value?: string): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : undefined;
}

function isValidPaymentIcon(value: string): boolean {
  return PAYMENT_TEMPLATE_ICON_KEYS.includes(value as (typeof PAYMENT_TEMPLATE_ICON_KEYS)[number]);
}

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requireAnyPermission(request, ["entities.write", "payments.read"]);

    const type = request.nextUrl.searchParams.get("type");

    if (type === "document") {
      const usageRows = await EntityDocument.aggregate([
        { $match: { documentTemplate: { $ne: null } } },
        { $group: { _id: "$documentTemplate", count: { $sum: 1 } } },
      ]);

      const usedTemplateIds = usageRows
        .map((row: any) => row?._id?.toString())
        .filter(Boolean);

      const templates = await DocumentTemplate.find({
        $or: [{ published: { $ne: false } }, { _id: { $in: usedTemplateIds } }],
      })
        .select("name color published createdAt")
        .sort({ name: 1 });

      const usageMap = new Map<string, number>();
      usageRows.forEach((row: any) => {
        usageMap.set(row._id.toString(), row.count);
      });

      return Response.json(
        {
          options: templates.map((item: any) => ({
            id: item._id.toString(),
            label: item.name,
            name: item.name,
            color: item.color,
            published: item.published !== false,
            unpublished: item.published === false,
            createdAt: item.createdAt,
            usageCount: usageMap.get(item._id.toString()) || 0,
          })),
        },
        { status: 200 }
      );
    }

    if (type === "credential") {
      const usageRows = await EntityCredential.aggregate([
        { $match: { credentialTemplate: { $ne: null } } },
        { $group: { _id: "$credentialTemplate", count: { $sum: 1 } } },
      ]);

      const usedTemplateIds = usageRows
        .map((row: any) => row?._id?.toString())
        .filter(Boolean);

      const templates = await CredentialTemplate.find({
        $or: [{ published: { $ne: false } }, { _id: { $in: usedTemplateIds } }],
      })
        .select("platform published createdAt")
        .sort({ platform: 1 });

      const usageMap = new Map<string, number>();
      usageRows.forEach((row: any) => {
        usageMap.set(row._id.toString(), row.count);
      });

      return Response.json(
        {
          options: templates.map((item: any) => ({
            id: item._id.toString(),
            label: item.platform,
            platform: item.platform,
            published: item.published !== false,
            unpublished: item.published === false,
            createdAt: item.createdAt,
            usageCount: usageMap.get(item._id.toString()) || 0,
          })),
        },
        { status: 200 }
      );
    }

    if (type === "payment") {
      const usageRows = await Records.aggregate([
        { $match: { method: { $ne: null } } },
        { $group: { _id: "$method", count: { $sum: 1 } } },
      ]);

      const usedMethods = usageRows
        .map((row: any) => (row?._id ? String(row._id) : ""))
        .filter(Boolean);

      const templates = await PaymentTemplate.find({
        $or: [{ published: { $ne: false } }, { method: { $in: usedMethods } }],
      })
        .select("method color icon published createdAt")
        .sort({ method: 1 });

      const usageMap = new Map<string, number>();
      usageRows.forEach((row: any) => {
        usageMap.set(String(row._id), row.count);
      });

      return Response.json(
        {
          options: templates.map((item: any) => ({
            id: item._id.toString(),
            label: item.method,
            method: item.method,
            color: item.color,
            icon: item.icon,
            published: item.published !== false,
            unpublished: item.published === false,
            createdAt: item.createdAt,
            usageCount: usageMap.get(item.method) || 0,
          })),
        },
        { status: 200 }
      );
    }

    if (type === "payment-status") {
      const usageRows = await Records.aggregate([
        { $match: { status: { $ne: null } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      const usedStatuses = usageRows
        .map((row: any) => (row?._id ? String(row._id) : ""))
        .filter(Boolean);

      const templates = await PaymentStatusTemplate.find({
        $or: [{ published: { $ne: false } }, { status: { $in: usedStatuses } }],
      })
        .select("status color appliesTo published createdAt")
        .sort({ status: 1 });

      const usageMap = new Map<string, number>();
      usageRows.forEach((row: any) => {
        usageMap.set(String(row._id), row.count);
      });

      return Response.json(
        {
          options: templates.map((item: any) => ({
            id: item._id.toString(),
            label: item.status,
            status: item.status,
            color: item.color,
            appliesTo: item.appliesTo || "both",
            published: item.published !== false,
            unpublished: item.published === false,
            createdAt: item.createdAt,
            usageCount: usageMap.get(item.status) || 0,
          })),
        },
        { status: 200 }
      );
    }

    const [documentUsageRows, credentialUsageRows, paymentUsageRows, paymentStatusUsageRows] = await Promise.all([
      EntityDocument.aggregate([
        { $match: { documentTemplate: { $ne: null } } },
        { $group: { _id: "$documentTemplate", count: { $sum: 1 } } },
      ]),
      EntityCredential.aggregate([
        { $match: { credentialTemplate: { $ne: null } } },
        { $group: { _id: "$credentialTemplate", count: { $sum: 1 } } },
      ]),
      Records.aggregate([
        { $match: { method: { $ne: null } } },
        { $group: { _id: "$method", count: { $sum: 1 } } },
      ]),
      Records.aggregate([
        { $match: { status: { $ne: null } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const documentUsageMap = new Map<string, number>();
    const credentialUsageMap = new Map<string, number>();
    const paymentUsageMap = new Map<string, number>();
    const paymentStatusUsageMap = new Map<string, number>();

    documentUsageRows.forEach((row: any) => {
      documentUsageMap.set(row._id.toString(), row.count);
    });
    credentialUsageRows.forEach((row: any) => {
      credentialUsageMap.set(row._id.toString(), row.count);
    });
    paymentUsageRows.forEach((row: any) => {
      paymentUsageMap.set(String(row._id), row.count);
    });
    paymentStatusUsageRows.forEach((row: any) => {
      paymentStatusUsageMap.set(String(row._id), row.count);
    });

    const [documentTemplates, credentialTemplates, paymentTemplates, paymentStatusTemplates] = await Promise.all([
      DocumentTemplate.find({
        $or: [
          { published: { $ne: false } },
          { _id: { $in: Array.from(documentUsageMap.keys()) } },
        ],
      })
        .select("name color published")
        .sort({ name: 1 }),
      CredentialTemplate.find({
        $or: [
          { published: { $ne: false } },
          { _id: { $in: Array.from(credentialUsageMap.keys()) } },
        ],
      })
        .select("platform published")
        .sort({ platform: 1 }),
      PaymentTemplate.find({
        $or: [
          { published: { $ne: false } },
          { method: { $in: Array.from(paymentUsageMap.keys()) } },
        ],
      })
        .select("method color icon published")
        .sort({ method: 1 }),
      PaymentStatusTemplate.find({
        $or: [
          { published: { $ne: false } },
          { status: { $in: Array.from(paymentStatusUsageMap.keys()) } },
        ],
      })
        .select("status color appliesTo published")
        .sort({ status: 1 }),
    ]);

    return Response.json(
      {
        documentOptions: documentTemplates.map((item: any) => ({
          id: item._id.toString(),
          label: item.name,
          name: item.name,
          color: item.color,
          published: item.published !== false,
          unpublished: item.published === false,
        })),
        credentialOptions: credentialTemplates.map((item: any) => ({
          id: item._id.toString(),
          label: item.platform,
          platform: item.platform,
          published: item.published !== false,
          unpublished: item.published === false,
        })),
        paymentOptions: paymentTemplates.map((item: any) => ({
          id: item._id.toString(),
          label: item.method,
          method: item.method,
          color: item.color,
          icon: item.icon,
          published: item.published !== false,
          unpublished: item.published === false,
        })),
        paymentStatusOptions: paymentStatusTemplates.map((item: any) => ({
          id: item._id.toString(),
          label: item.status,
          status: item.status,
          color: item.color,
          appliesTo: item.appliesTo || "both",
          published: item.published !== false,
          unpublished: item.published === false,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error fetching templates:", error);
    }

    return Response.json(
      { message: getServiceErrorMessage(error, "Error fetching templates"), options: [] },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "entities.write");

    const body = await request.json();
    const { type, name, platform } = body;

    if (
      !type ||
      (type === "document" && !name?.trim()) ||
      (type === "credential" && !platform?.trim()) ||
      (type === "payment" && !body?.method?.trim()) ||
      (type === "payment-status" && !body?.status?.trim())
    ) {
      return Response.json(
        { message: "Invalid input: type and name/platform are required" },
        { status: 400 }
      );
    }

    if (type === "document") {
      const exists = await DocumentTemplate.findOne({ name: name.trim() });
      if (exists) {
        if (exists.published === false) {
          exists.published = true;
          const selectedColor = normalizeHexColor(body?.color);
          if (selectedColor) {
            exists.color = selectedColor;
          }
          await exists.save();

          return Response.json(
            {
              message: "Document template restored successfully",
              template: {
                id: exists._id.toString(),
                name: exists.name,
                color: exists.color,
              },
            },
            { status: 200 }
          );
        }

        return Response.json(
          { message: "Document template with this name already exists" },
          { status: 409 }
        );
      }

      const selectedColor = normalizeHexColor(body?.color);
      const color = selectedColor
        ? selectedColor
        : await DocumentTemplate.find({}).select("color").lean().then((rows: any[]) => {
            const existingColors = rows.map((row) => row?.color).filter(Boolean);
            return generateEntityColor(existingColors);
          });

      const template = await DocumentTemplate.create({ name: name.trim(), color, published: true });
      return Response.json(
        {
          message: "Document template created successfully",
          template: {
            id: template._id.toString(),
            name: template.name,
            color: template.color,
          },
        },
        { status: 201 }
      );
    }

    if (type === "credential") {
      const exists = await CredentialTemplate.findOne({ platform: platform.trim() });
      if (exists) {
        if (exists.published === false) {
          exists.published = true;
          await exists.save();
          return Response.json(
            {
              message: "Credential template restored successfully",
              template: {
                id: exists._id.toString(),
                platform: exists.platform,
              },
            },
            { status: 200 }
          );
        }

        return Response.json(
          { message: "Credential template with this platform already exists" },
          { status: 409 }
        );
      }

      const template = await CredentialTemplate.create({ platform: platform.trim(), published: true });
      return Response.json(
        {
          message: "Credential template created successfully",
          template: {
            id: template._id.toString(),
            platform: template.platform,
          },
        },
        { status: 201 }
      );
    }

    if (type === "payment") {
      const method = body.method.trim();
      const selectedIcon = String(body?.icon || DEFAULT_PAYMENT_TEMPLATE_ICON);
      const selectedColor = normalizeHexColor(body?.color);

      if (!isValidPaymentIcon(selectedIcon)) {
        return Response.json(
          { message: "Invalid payment icon" },
          { status: 400 }
        );
      }

      const exists = await PaymentTemplate.findOne({ method });
      if (exists) {
        if (exists.published === false) {
          exists.published = true;
          exists.icon = selectedIcon;
          if (selectedColor) {
            exists.color = selectedColor;
          }
          await exists.save();
          return Response.json(
            {
              message: "Payment method template restored successfully",
              template: {
                id: exists._id.toString(),
                method: exists.method,
                color: exists.color,
                icon: exists.icon,
              },
            },
            { status: 200 }
          );
        }

        return Response.json(
          { message: "Payment method template already exists" },
          { status: 409 }
        );
      }

      const color = selectedColor
        ? selectedColor
        : await PaymentTemplate.find({}).select("color").lean().then((rows: any[]) => {
            const existingColors = rows.map((row) => row?.color).filter(Boolean);
            return generateEntityColor(existingColors);
          });

      const template = await PaymentTemplate.create({ method, color, icon: selectedIcon, published: true });
      return Response.json(
        {
          message: "Payment method template created successfully",
          template: {
            id: template._id.toString(),
            method: template.method,
            color: template.color,
            icon: template.icon,
          },
        },
        { status: 201 }
      );
    }

    if (type === "payment-status") {
      const statusLabel = body.status.trim();
      const appliesTo = ["income", "expense", "both"].includes(String(body?.appliesTo || "").toLowerCase())
        ? String(body.appliesTo).toLowerCase()
        : "both";
      const selectedColor = normalizeHexColor(body?.color);

      const exists = await PaymentStatusTemplate.findOne({ status: statusLabel });
      if (exists) {
        if (exists.published === false) {
          exists.published = true;
          exists.appliesTo = appliesTo;
          if (selectedColor) {
            exists.color = selectedColor;
          }
          await exists.save();
          return Response.json(
            {
              message: "Payment status template restored successfully",
              template: {
                id: exists._id.toString(),
                status: exists.status,
                color: exists.color,
                appliesTo: exists.appliesTo,
              },
            },
            { status: 200 }
          );
        }

        return Response.json(
          { message: "Payment status template already exists" },
          { status: 409 }
        );
      }

      const color = selectedColor
        ? selectedColor
        : await PaymentStatusTemplate.find({}).select("color").lean().then((rows: any[]) => {
            const existingColors = rows.map((row) => row?.color).filter(Boolean);
            return generateEntityColor(existingColors);
          });

      const template = await PaymentStatusTemplate.create({
        status: statusLabel,
        color,
        appliesTo,
        published: true,
      });

      return Response.json(
        {
          message: "Payment status template created successfully",
          template: {
            id: template._id.toString(),
            status: template.status,
            color: template.color,
            appliesTo: template.appliesTo,
          },
        },
        { status: 201 }
      );
    }

    return Response.json(
      { message: "Invalid template type" },
      { status: 400 }
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error creating template:", error);
    }

    return Response.json(
      { message: getServiceErrorMessage(error, "Error creating template") },
      { status }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "entities.write");

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");
    const type = searchParams.get("type");

    if (!templateId || !type) {
      return Response.json(
        { message: "Missing template id or type" },
        { status: 400 }
      );
    }

    if (type === "document") {
      const template = await DocumentTemplate.findByIdAndUpdate(
        templateId,
        { published: false },
        { new: true }
      );
      if (!template) {
        return Response.json(
          { message: "Document template not found" },
          { status: 404 }
        );
      }
      return Response.json(
        { message: "Document template unpublished successfully" },
        { status: 200 }
      );
    }

    if (type === "credential") {
      const template = await CredentialTemplate.findByIdAndUpdate(
        templateId,
        { published: false },
        { new: true }
      );
      if (!template) {
        return Response.json(
          { message: "Credential template not found" },
          { status: 404 }
        );
      }
      return Response.json(
        { message: "Credential template unpublished successfully" },
        { status: 200 }
      );
    }

    if (type === "payment") {
      const template = await PaymentTemplate.findByIdAndUpdate(
        templateId,
        { published: false },
        { new: true }
      );
      if (!template) {
        return Response.json(
          { message: "Payment method template not found" },
          { status: 404 }
        );
      }
      return Response.json(
        { message: "Payment method template unpublished successfully" },
        { status: 200 }
      );
    }

    if (type === "payment-status") {
      const template = await PaymentStatusTemplate.findByIdAndUpdate(
        templateId,
        { published: false },
        { new: true }
      );
      if (!template) {
        return Response.json(
          { message: "Payment status template not found" },
          { status: 404 }
        );
      }
      return Response.json(
        { message: "Payment status template unpublished successfully" },
        { status: 200 }
      );
    }

    return Response.json(
      { message: "Invalid template type" },
      { status: 400 }
    );
  } catch (error) {
    const status = getServiceErrorStatus(error);
    if (status >= 500) {
      console.error("Error deleting template:", error);
    }

    return Response.json(
      { message: getServiceErrorMessage(error, "Error deleting template") },
      { status }
    );
  }
}
