const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const yesNo = (value: boolean) => (value ? "Si" : "No");

const formatEuro = (value: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

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
  alerted: boolean;
  totalPrice: number;
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
      @page {
        size: A4;
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      :root {
        --primary: #2A75B9;
        --primary-soft: #eff6ff;
        --primary-border: #bfdbfe;
        --text-strong: #0f172a;
        --text-muted: #475569;
      }

      html, body {
        margin: 0;
        padding: 0;
        width: 210mm;
        height: 297mm;
        font-family: "Helvetica Neue", Arial, sans-serif;
        color: var(--text-strong);
        font-size: 12pt;
      }

      .sheet {
        width: 210mm;
        height: 297mm;
        padding: 3mm;
        display: flex;
        flex-direction: column;
      }

      .copy {
        padding: 3mm 2.5mm;
      }

      .copy + .copy {
        margin-top: 1.5mm;
        padding-top: 2.5mm;
        border-top: 0.3mm dashed black;
      }

      .header {
        display: flex;
        justify-content: space-between;
        border-bottom: 0.3mm solid var(--primary-border);
        padding-bottom: 2mm;
        margin-bottom: 2.5mm;
      }

      .header.single {
        justify-content: flex-end;
      }

      .brand {
        display: flex;
        gap: 3mm;
      }

      .brand-logo {
        width: 11mm;
        height: 11mm;
      }

      .brand-logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .brand-name {
        margin: 0;
        font-size: 12pt;
        font-weight: 700;
      }

      .brand-info {
        margin: 1mm 0 0;
        font-size: 9pt;
        color: var(--text-muted);
        line-height: 1.4;
      }

      .meta-box {
        border: 0.3mm solid var(--primary-border);
        border-left: 1mm solid var(--primary);
        padding: 2mm 2.5mm;
        border-radius: 2mm;
        text-align: right;
        display: inline-flex;
        flex-direction: column;
        gap: 1mm;
        background: #fff;
        max-width: 55mm;
      }

      .header.single .meta-box {
        margin-left: auto;
      }

      .report-meta-title {
        font-size: 12pt;
        color: var(--primary);
        margin: 0;
        font-weight: 700;
      }

      .report-meta-date {
        font-weight: 600;
        font-size: 10pt;
      }

      .section {
        margin-top: 4mm;
      }

      .section-title {
        font-size: 9pt;
        color: var(--primary);
        margin-bottom: 1.5mm;
        text-transform: uppercase;
        font-weight: 700;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3mm;
      }

      .row {
        display: flex;
        flex-direction: column;
        gap: 1.5mm;
        background: var(--primary-soft);
        border: 0.3mm solid var(--primary-border);
        border-left: 1mm solid var(--primary);
        border-radius: 2mm;
        padding: 2.5mm;
      }

      .label {
        font-size: 8pt;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
      }

      .value {
        font-size: 10pt;
        font-weight: 600;
        word-break: break-word;
      }

      .handwritten-box {
        margin-top: 4mm;
      }

      .work-container {
        display: flex;
        gap: 4mm;
      }

      .work-left {
        flex: 1;
      }

      .work-caption {
        font-size: 9pt;
        margin-bottom: 1.5mm;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
      }

      .work-layout {
        display: flex;
        gap: 2mm;
      }

      .work-square {
        width: 20mm;
        height: 20mm;
        border: 0.3mm solid var(--primary-border);
      }

      .work-space {
        flex: 1;
        border: 0.3mm solid var(--primary-border);
      }

      .work-line {
        height: 6mm;
        border-bottom: 0.2mm solid #93c5fd;
      }

      .price-container {
        width: 20mm;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .price-label {
        font-size: 9pt;
        margin-bottom: 1.5mm;
        font-weight: 700;
        color: var(--primary);
        text-transform: uppercase;
      }

      .price-box {
        width: 20mm;
        height: 20mm;
        border: 0.3mm solid var(--primary-border);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 10pt;
        font-weight: 700;
        padding: 1mm;
      }

      .price-box.empty {
        font-weight: 400;
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

          <div class="meta-box">
            <p class="report-meta-title">Rapporto #${report.id}</p>
            <div class="report-meta-date">Data: ${escapeHtml(report.createdAtLabel)}</div>
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
            <div class="row"><span class="label">Avvisato</span><span class="value">${report.alerted ? yesNo(report.alerted) : ""}</span></div>
          </div>
        </section>
      </section>

      <section class="copy">
        <header class="header single">
          <div class="meta-box">
            <p class="report-meta-title">Rapporto #${report.id}</p>
            <div class="report-meta-date">Data: ${escapeHtml(report.createdAtLabel)}</div>
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
            <div class="row"><span class="label">Avvisato</span><span class="value">${report.alerted ? yesNo(report.alerted) : ""}</span></div>
          </div>
        </section>

        <section class="handwritten-box">
          <div class="work-container">
            <div class="work-left">
              <p class="work-caption">Lavoro eseguito</p>
              <div class="work-layout">
                <div class="work-square"></div>
                <div class="work-space">
                  <div class="work-line"></div>
                  <div class="work-line"></div>
                  <div class="work-line"></div>
                </div>
              </div>
            </div>

            <div class="price-container">
              <p class="price-label">Importo totale</p>
              <div class="price-box ${report.totalPrice > 0 ? "" : "empty"}">${report.totalPrice > 0 ? formatEuro(report.totalPrice) : ""}</div>
            </div>
          </div>
        </section>

      </section>

    </main>
  </body>
</html>
`;