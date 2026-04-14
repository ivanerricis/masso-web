const escapeHtml = (value: string) =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

const yesNo = (value: boolean) => (value ? "Si" : "No");

export type ReportPrintData = {
    id: number;
    labName: string;
    labEmail: string;
    labAddress: string;
    labPhone: string;
    labLogoUrl: string;
    customerName: string;
    customerPhone: string;
    deviceName: string;
    issueDescription: string;
    note: string;
    password: string;
    dataBackup: boolean;
    charger: boolean;
    createdAtLabel: string;
};

export const buildReportPrintHtml = (report: ReportPrintData) => `
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rapporto #${report.id}</title>
    <style>
      * { box-sizing: border-box; }

      :root {
        --primary: #2563eb;
        --primary-soft: #eff6ff;
        --primary-border: #bfdbfe;
        --text-strong: #0f172a;
        --text-muted: #475569;
      }

      body {
        margin: 0;
        font-family: "Helvetica Neue", Arial, sans-serif;
        color: var(--text-strong);
        background: white;
        font-size: 15px;
      }

      .sheet {
        width: 100%;
        min-height: 100vh;
        padding: 4px;
      }

      .copy {
        border: 1px solid var(--primary-border);
        border-radius: 8px;
        padding: 10px;
        background: #ffffff;
        page-break-inside: avoid;
      }

      .copy + .copy {
        margin-top: 8px;
        border-top: 2px dashed #94a3b8;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid var(--primary-border);
        padding-bottom: 6px;
        margin-bottom: 8px;
        gap: 12px;
      }

      .header.single {
        justify-content: flex-end;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .brand-logo {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        border: 1px solid var(--primary-border);
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        overflow: hidden;
      }

      .brand-logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .brand-name {
        margin: 0;
        font-size: 1em;
        font-weight: 800;
      }

      .brand-info {
        margin: 2px 0 0;
        font-size: 0.75em;
        line-height: 1.35;
        color: var(--text-muted);
      }

      .meta {
        color: var(--text-muted);
        font-size: 0.9em;
        font-weight: 600;
        text-align: right;
      }

      .report-meta-title {
        margin: 0;
        font-size: 1em;
        text-transform: uppercase;
        color: var(--primary);
        font-weight: 700;
      }

      .section {
        margin-top: 18px;
      }

      .section-title {
        margin: 0 0 6px;
        font-size: 0.8em;
        color: var(--primary);
        text-transform: uppercase;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px 10px;
      }

      .row {
        display: flex;
        flex-direction: column;
        gap: 3px;
        background: var(--primary-soft);
        border: 1px solid var(--primary-border);
        border-left: 5px solid var(--primary);
        border-radius: 8px;
        padding: 7px 10px;
        min-height: 46px;
      }

      .label {
        font-size: 0.75em;
        color: var(--primary);
        font-weight: 700;
        text-transform: uppercase;
      }

      .value {
        font-size: 0.9em;
        font-weight: 600;
        word-break: break-word;
      }

      .handwritten-box {
        margin-top: 10px;
        padding: 8px;
      }

      .work-layout {
        display: flex;
        gap: 8px;
      }

      .work-space {
        flex: 1;
        border: 1px solid var(--primary-border);
        min-height: 84px;
      }

      .work-line {
        height: 28px;
        border-bottom: 1px solid #93c5fd;
      }

      .work-square {
        width: 84px;
        border: 1px solid var(--primary-border);
      }

      .work-caption {
        margin: 6px 0 0;
        font-size: 0.75em;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
      }

      .cut-label {
        margin: 14px 0;
        border-bottom: 1px dashed black;
      }

      .price-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .price-label {
        font-size: 0.8em;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
      }

      .price-box {
        flex: 1;
        height: 28px;
        border: 1px solid var(--primary-border);
        border-radius: 8px;
      }

      @media print {
        .sheet { border: none; }
      }
    </style>
  </head>

  <body>
    <main class="sheet">
      <section class="copy">
        <header class="header">
          <div class="brand">
            <div class="brand-logo">
              <img src="${escapeHtml(report.labLogoUrl)}" />
            </div>
            <div>
              <p class="brand-name">${escapeHtml(report.labName)}</p>
              <p class="brand-info">
                Email: ${escapeHtml(report.labEmail)}<br />
                Indirizzo: ${escapeHtml(report.labAddress)}<br />
                Tel: ${escapeHtml(report.labPhone)}
              </p>
            </div>
          </div>
          <div class="meta">
            <p class="report-meta-title">Rapporto #${report.id}</p>
            <div>Data: ${escapeHtml(report.createdAtLabel)}</div>
          </div>
        </header>

        <section class="section">
          <h2 class="section-title">Cliente e dispositivo</h2>
          <div class="grid">
            <div class="row"><span class="label">Cliente</span><span class="value">${escapeHtml(report.customerName)}</span></div>
            <div class="row"><span class="label">Telefono</span><span class="value">${escapeHtml(report.customerPhone)}</span></div>
            <div class="row"><span class="label">Dispositivo</span><span class="value">${escapeHtml(report.deviceName)}</span></div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">Dettagli lavorazione</h2>
          <div class="grid">
            <div class="row"><span class="label">Descrizione problema</span><span class="value">${escapeHtml(report.issueDescription)}</span></div>
            <div class="row"><span class="label">Password</span><span class="value">${escapeHtml(report.password)}</span></div>
            <div class="row"><span class="label">Note</span><span class="value">${escapeHtml(report.note)}</span></div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">Stato</h2>
          <div class="grid">
            <div class="row"><span class="label">Backup dati</span><span class="value">${yesNo(report.dataBackup)}</span></div>
            <div class="row"><span class="label">Alimentatore</span><span class="value">${yesNo(report.charger)}</span></div>
          </div>
        </section>
      </section>

      <div class="cut-label"></div>

      <section class="copy">
        <header class="header single">
          <div class="meta">
            <p class="report-meta-title">Rapporto #${report.id}</p>
            <div>Data: ${escapeHtml(report.createdAtLabel)}</div>
          </div>
        </header>

        <section class="section">
          <h2 class="section-title">Cliente e dispositivo</h2>
          <div class="grid">
            <div class="row"><span class="label">Cliente</span><span class="value">${escapeHtml(report.customerName)}</span></div>
            <div class="row"><span class="label">Telefono</span><span class="value">${escapeHtml(report.customerPhone)}</span></div>
            <div class="row"><span class="label">Dispositivo</span><span class="value">${escapeHtml(report.deviceName)}</span></div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">Dettagli lavorazione</h2>
          <div class="grid">
            <div class="row"><span class="label">Descrizione problema</span><span class="value">${escapeHtml(report.issueDescription)}</span></div>
            <div class="row"><span class="label">Password</span><span class="value">${escapeHtml(report.password)}</span></div>
            <div class="row"><span class="label">Note</span><span class="value">${escapeHtml(report.note)}</span></div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title">Stato</h2>
          <div class="grid">
            <div class="row"><span class="label">Backup dati</span><span class="value">${yesNo(report.dataBackup)}</span></div>
            <div class="row"><span class="label">Alimentatore</span><span class="value">${yesNo(report.charger)}</span></div>
          </div>
        </section>

        <section class="handwritten-box">
          <p class="work-caption">Lavoro eseguito</p>
          <div class="work-layout">
            <div class="work-square"></div>
            <div class="work-space">
              <div class="work-line"></div>
              <div class="work-line"></div>
              <div class="work-line"></div>
            </div>
          </div>
        </section>

        <section class="handwritten-box">
          <div class="price-row">
            <p class="price-label">Prezzo</p>
            <div class="price-box"></div>
          </div>
        </section>
      </section>
    </main>
  </body>
</html>
`;