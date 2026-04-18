import * as XLSX from "xlsx";

type ExportRow = Record<string, string | number | boolean | null | undefined>;

function downloadBlob(content: BlobPart, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportRowsCsv(rows: ExportRow[], filePrefix: string) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];

  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeCsv(row[header])).join(","));
  });

  downloadBlob(
    lines.join("\n"),
    `${filePrefix}-${Date.now()}.csv`,
    "text/csv;charset=utf-8;"
  );
}

export function exportRowsExcel(rows: ExportRow[], filePrefix: string) {
  if (!rows.length) return;

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filePrefix}-${Date.now()}.xlsx`);
}

export async function exportRowsPdf(rows: ExportRow[], filePrefix: string) {
  if (!rows.length) return;

  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape" });
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => String(row[header] ?? "")));

  autoTable(doc, {
    head: [headers],
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [14, 116, 144] },
    margin: { top: 16 },
  });

  doc.save(`${filePrefix}-${Date.now()}.pdf`);
}
