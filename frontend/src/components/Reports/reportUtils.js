export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? "" : String(cell);
          const escaped = value.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");
}

export function formatReportDate(value = new Date()) {
  return new Date(value).toLocaleString();
}

export function statusLabel(value) {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function openPrintDocument({ title, subtitle, bodyHtml }) {
  const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
      <style>
        :root {
          color-scheme: light;
          --ink: #0f172a;
          --muted: #475569;
          --soft: #e2e8f0;
          --panel: #f8fafc;
          --accent: #0284c7;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 40px;
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          color: var(--ink);
          background: white;
        }
        .sheet {
          max-width: 980px;
          margin: 0 auto;
        }
        .hero {
          border: 1px solid var(--soft);
          border-radius: 28px;
          padding: 28px 32px;
          background: linear-gradient(135deg, #eff6ff, #f8fafc 55%, #ecfeff);
        }
        .eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--accent);
        }
        h1 {
          margin: 14px 0 10px;
          font-size: 34px;
          line-height: 1.15;
        }
        .subtitle {
          margin: 0;
          max-width: 740px;
          color: var(--muted);
          font-size: 15px;
          line-height: 1.7;
        }
        .section {
          margin-top: 22px;
          border: 1px solid var(--soft);
          border-radius: 24px;
          padding: 22px 24px;
          background: var(--panel);
        }
        .section h2 {
          margin: 0 0 14px;
          font-size: 20px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }
        .stat, .card {
          border: 1px solid var(--soft);
          border-radius: 18px;
          padding: 14px 16px;
          background: white;
        }
        .label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .value {
          margin-top: 8px;
          font-size: 24px;
          font-weight: 800;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 18px;
          overflow: hidden;
        }
        th, td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--soft);
          text-align: left;
          vertical-align: top;
          font-size: 14px;
        }
        th {
          background: #f1f5f9;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--muted);
        }
        tr:last-child td { border-bottom: none; }
        .small {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }
        .badge {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          background: #e0f2fe;
          color: #0c4a6e;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .muted-list { margin: 0; padding-left: 18px; color: var(--muted); }
        .muted-list li { margin: 8px 0; }
        @media print {
          body { padding: 0; }
          .sheet { max-width: none; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <section class="hero">
          <div class="eyebrow">Campus Hub Report</div>
          <h1>${escapeHtml(title)}</h1>
          <p class="subtitle">${escapeHtml(subtitle || "")}</p>
        </section>
        ${bodyHtml}
      </div>
    </body>
  </html>`;
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;
  if (!iframeWindow) {
    document.body.removeChild(iframe);
    return;
  }

  const cleanup = () => {
    window.setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };

  iframeWindow.document.open();
  iframeWindow.document.write(html);
  iframeWindow.document.close();

  const triggerPrint = () => {
    iframeWindow.focus();
    iframeWindow.print();
    cleanup();
  };

  iframe.onload = triggerPrint;
  window.setTimeout(triggerPrint, 700);
}
