import StatementOfAccountView from "@/components/Reports/StatementOfAccountView";
import { redirect } from "next/navigation";

type PageProps = {
  params: {
    entityType: string;
    id: string;
  };
  searchParams?: {
    mode?: string;
    scope?: string;
    from?: string;
    to?: string;
  };
};

function parseMode(value?: string) {
  return value === "custom" ? "custom" : "all-time";
}

export default function StatementOfAccountPage({ params, searchParams }: PageProps) {
  const mode = parseMode(searchParams?.mode);
  const scope = searchParams?.scope === "employees" || searchParams?.scope === "mixed" ? searchParams.scope : "company";

  if (mode === "custom") {
    const from = String(searchParams?.from || "").trim();
    const to = String(searchParams?.to || "").trim();
    if (!from || !to || from > to) {
      redirect(`/${params.entityType}/${params.id}/records`);
    }

    return (
      <StatementOfAccountView
        entityType={params.entityType as "company" | "employee" | "individual"}
        id={params.id}
        mode={mode}
        scope={scope as "company" | "employees" | "mixed"}
        from={from}
        to={to}
      />
    );
  }

  return (
    <StatementOfAccountView
      entityType={params.entityType as "company" | "employee" | "individual"}
      id={params.id}
      mode={mode}
      scope={scope as "company" | "employees" | "mixed"}
    />
  );
}