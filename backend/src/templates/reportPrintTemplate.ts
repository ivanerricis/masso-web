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
  alerted: boolean;
  totalPrice: number;
  createdAtLabel: string;
};

const formatEuro = (value: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const buildReportPrintHtml = (report: ReportPrintData) => `
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8" />
<title>Rapporto #${report.id}</title>

<style>
@page {
  size: A4;
  margin: 0;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --blue: #2A75B9;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  font-size: 13.5pt;
  color: #111;
}

.sheet {
  width: 210mm;
  height: 297mm;
  padding: 5mm;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.copy {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.line-dashed {
  border-top: 1px dashed #000;
  margin-top: 2mm;
  margin-bottom: 2mm;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2mm;
}

.brand {
  display: flex;
  gap: 2mm;
}

.logo {
  width: 10mm;
  height: 10mm;
  flex-shrink: 0;
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-name {
  font-size: 15pt;
  font-weight: bold;
  color: var(--blue);
}

.brand-info {
  font-size: 10.5pt;
  line-height: 1.3;
}

.meta {
  flex-shrink: 0;
  text-align: right;
  border: 1px solid var(--blue);
  padding: 1.5mm 2mm;
}

.meta-title {
  font-weight: bold;
  font-size: 13pt;
  color: var(--blue);
}

.meta-date {
  font-size: 10.5pt;
}

.section {
  margin-bottom: 3mm;
}

.section-title {
  font-weight: bold;
  font-size: 11pt;
  margin-bottom: 1mm;
  color: var(--blue);
  // border-bottom: 1px solid var(--blue);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table td {
  border: 1px solid #000;
  padding: 1.5mm;
}

.label {
  font-size: 9pt;
  color: #555;
}

.value {
  font-weight: bold;
  font-size: 11.75pt;
}

.section-grow {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin-bottom: 3mm;
}

.notes-grow {
  flex: 1;
  border: 1px solid #000;
  border-bottom: 0;
  height: 25mm;
}

.line {
  width: 100%;
  margin-top: 8mm;
  height: 0.3mm;
  background-color: black;
}

.payment-row {
  display: flex;
  align-items: flex-end;
  gap: 4mm;
}

.price-container {
  flex-shrink: 0;
}

.price-box {
  width: 35mm;
  height: 18mm;
  border: 1px solid #000;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 12pt;
        font-weight: bold;
        padding: 1mm;
      }

      .price-box.empty {
        font-weight: normal;
}

.payment-methods {
  display: flex;
  gap: 3mm;
}

.payment-box {
  width: 22mm;
  height: 18mm;
  border: 1px solid #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5mm;
}

.payment-label {
  font-size: 9pt;
  color: #555;
  text-align: center;
  line-height: 1.2;
}
</style>
</head>

<body>
<main class="sheet">

  <!-- COPIA CLIENTE -->
  <section class="copy">

    <div class="header">
      <div class="brand">
        <div class="logo">
          <img src="${escapeHtml(report.labLogoUrl)}" alt="logo" />
        </div>
        <div>
          <p class="brand-name">${escapeHtml(report.labName)}</p>
          <div class="brand-info">
            ${escapeHtml(report.labAddress)}<br>
            ${escapeHtml(report.labEmail)}<br>
            ${escapeHtml(report.labPhone)}
          </div>
        </div>
      </div>
      <div class="meta">
        <div class="meta-title">Rapporto #${report.id}</div>
        <div class="meta-date">${escapeHtml(report.createdAtLabel)}</div>
      </div>
    </div>

    ${sectionCliente(report)}
    ${sectionDevice(report)}
    ${sectionDettagli(report)}
    ${sectionStato(report)}

  </section>

  <div class="line-dashed"></div>

  <!-- COPIA INTERNA -->
  <section class="copy">

    <div class="header" style="justify-content: flex-end;">
      <div class="meta">
        <div class="meta-title">Rapporto #${report.id}</div>
        <div class="meta-date">${escapeHtml(report.createdAtLabel)}</div>
      </div>
    </div>

    ${sectionCliente(report)}
    ${sectionDevice(report)}
    ${sectionDettagli(report)}
    ${sectionStato(report)}

    <div class="section-grow">
      <div class="section-title">Lavoro eseguito</div>
      <div class="notes-grow">
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
    </div>
    </div>

    <div class="payment-row">

      <div class="price-container">
        <div class="section-title">Avvisato</div>
        <div class="price-box ${report.alerted ? "" : "empty"}">${report.alerted ? "Si" : ""}</div>
      </div>

      <div class="price-container">
        <div class="section-title">Importo totale</div>
        <div class="price-box ${report.totalPrice > 0 ? "" : "empty"}">${report.totalPrice > 0 ? formatEuro(report.totalPrice) : ""}</div>
      </div>

      <div>
        <div class="section-title">Pagamento</div>
        <div class="payment-methods">

          <!-- Contanti -->
          <div class="payment-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                 stroke="#111" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="6" width="22" height="13" rx="2"/>
              <circle cx="12" cy="12" r="3"/>
              <circle cx="5"  cy="12" r="1.2"/>
              <circle cx="19" cy="12" r="1.2"/>
            </svg>
            <div class="payment-label">Contanti</div>
          </div>

          <!-- Carta -->
          <div class="payment-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                 stroke="#111" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="5" width="22" height="15" rx="2"/>
              <line x1="1"  y1="10" x2="23" y2="10"/>
              <rect x="3" y="13" width="4" height="3" rx="0.5"/>
              <line x1="9"  y1="14"  x2="13" y2="14"/>
              <line x1="9"  y1="15.5" x2="11" y2="15.5"/>
            </svg>
            <div class="payment-label">Carta</div>
          </div>

        </div>
      </div>

    </div>

  </section>

</main>
</body>
</html>
`;

const sectionCliente = (r: ReportPrintData) => `
<div class="section">
  <div class="section-title">Cliente</div>
  <table class="table">
    <tr>
      <td><div class="label">Nome</div><div class="value">${escapeHtml(r.customerName)}</div></td>
      <td><div class="label">Telefono</div><div class="value">${escapeHtml(r.customerPhone)}</div></td>
    </tr>
  </table>
</div>`;

const sectionDevice = (r: ReportPrintData) => `
<div class="section">
  <div class="section-title">Dispositivo</div>
  <table class="table">
    <tr>
      <td><div class="label">Nome</div><div class="value">${escapeHtml(r.deviceName)}</div></td>
    </tr>
  </table>
</div>`;

const sectionDettagli = (r: ReportPrintData) => `
<div class="section">
  <div class="section-title">Dettagli</div>
  <table class="table">
    <tr>
      <td><div class="label">Problema</div><div class="value">${escapeHtml(r.issueDescription)}</div></td>
      <td><div class="label">Password</div><div class="value">${escapeHtml(r.password)}</div></td>
    </tr>
    <tr>
      <td colspan="2"><div class="label">Note</div><div class="value">${escapeHtml(r.note)}</div></td>
    </tr>
  </table>
</div>`;

const sectionStato = (r: ReportPrintData) => `
<div class="section">
  <div class="section-title">Stato</div>
  <table class="table">
    <tr>
      <td><div class="label">Backup dati</div><div class="value">${yesNo(r.dataBackup)}</div></td>
      <td><div class="label">Alimentatore</div><div class="value">${yesNo(r.charger)}</div></td>
    </tr>
  </table>
</div>`;