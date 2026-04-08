export function printElementById(elementId: string, reportTitle: string) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const reportRoot = document.getElementById(elementId);
  if (!reportRoot) {
    throw new Error("Report section not found.");
  }

  const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((node) => node.outerHTML)
    .join("\n");

  const popup = window.open("", "_blank", "width=1200,height=900");
  if (!popup) {
    throw new Error("Could not open print preview window.");
  }

  popup.document.open();
  popup.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${reportTitle}</title>
    ${styles}
    <style>
      body {
        margin: 0;
        padding: 24px;
        background: #ffffff;
        color: #111827;
        font-family: Arial, sans-serif;
      }
      .report-print-title {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 700;
      }
      .report-print-meta {
        margin: 0 0 20px 0;
        color: #6b7280;
        font-size: 12px;
      }
      @media print {
        body {
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <h1 class="report-print-title">${reportTitle}</h1>
    <p class="report-print-meta">Generated on ${new Date().toLocaleString()}</p>
    <div>${reportRoot.innerHTML}</div>
  </body>
</html>`);
  popup.document.close();

  popup.focus();
  popup.print();
  popup.close();
}
