import connect from "@/db/mongo";
import { requirePermission } from "@/auth/guards";
import { NextRequest } from "next/server";
import DocumentTemplate from "@/models/documentTemplates";
import CredentialTemplate from "@/models/credentialTemplates";

export async function GET(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "entities.write");

    const type = request.nextUrl.searchParams.get("type");

    if (type === "document") {
      const templates = await DocumentTemplate.find({}).select("name").sort({ name: 1 });
      return Response.json(
        {
          options: templates.map((item: any) => ({
            id: item._id.toString(),
            label: item.name,
            name: item.name,
          })),
        },
        { status: 200 }
      );
    }

    if (type === "credential") {
      const templates = await CredentialTemplate.find({})
        .select("platform")
        .sort({ platform: 1 });
      return Response.json(
        {
          options: templates.map((item: any) => ({
            id: item._id.toString(),
            label: item.platform,
            platform: item.platform,
          })),
        },
        { status: 200 }
      );
    }

    const [documentTemplates, credentialTemplates] = await Promise.all([
      DocumentTemplate.find({}).select("name").sort({ name: 1 }),
      CredentialTemplate.find({}).select("platform").sort({ platform: 1 }),
    ]);

    return Response.json(
      {
        documentOptions: documentTemplates.map((item: any) => ({
          id: item._id.toString(),
          label: item.name,
          name: item.name,
        })),
        credentialOptions: credentialTemplates.map((item: any) => ({
          id: item._id.toString(),
          label: item.platform,
          platform: item.platform,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching templates:", error);
    return Response.json(
      { message: "Error fetching templates", options: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connect();
    await requirePermission(request, "entities.write");

    const body = await request.json();
    const { type, name, platform } = body;

    if (!type || (type === "document" && !name?.trim()) || (type === "credential" && !platform?.trim())) {
      return Response.json(
        { message: "Invalid input: type and name/platform are required" },
        { status: 400 }
      );
    }

    if (type === "document") {
      const exists = await DocumentTemplate.findOne({ name: name.trim() });
      if (exists) {
        return Response.json(
          { message: "Document template with this name already exists" },
          { status: 409 }
        );
      }

      const template = await DocumentTemplate.create({ name: name.trim() });
      return Response.json(
        {
          message: "Document template created successfully",
          template: {
            id: template._id.toString(),
            name: template.name,
          },
        },
        { status: 201 }
      );
    }

    if (type === "credential") {
      const exists = await CredentialTemplate.findOne({ platform: platform.trim() });
      if (exists) {
        return Response.json(
          { message: "Credential template with this platform already exists" },
          { status: 409 }
        );
      }

      const template = await CredentialTemplate.create({ platform: platform.trim() });
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

    return Response.json(
      { message: "Invalid template type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error creating template:", error);
    return Response.json(
      { message: "Error creating template" },
      { status: 500 }
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
      const template = await DocumentTemplate.findByIdAndDelete(templateId);
      if (!template) {
        return Response.json(
          { message: "Document template not found" },
          { status: 404 }
        );
      }
      return Response.json(
        { message: "Document template deleted successfully" },
        { status: 200 }
      );
    }

    if (type === "credential") {
      const template = await CredentialTemplate.findByIdAndDelete(templateId);
      if (!template) {
        return Response.json(
          { message: "Credential template not found" },
          { status: 404 }
        );
      }
      return Response.json(
        { message: "Credential template deleted successfully" },
        { status: 200 }
      );
    }

    return Response.json(
      { message: "Invalid template type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting template:", error);
    return Response.json(
      { message: "Error deleting template" },
      { status: 500 }
    );
  }
}
