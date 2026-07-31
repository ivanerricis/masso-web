import path from "node:path";
import pdfmake from "pdfmake";

/** Altezza A4 in punti, come la usa pdfmake. */
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 14;

/** Righe vuote di "Lavoro eseguito": alte quanto basta per scriverci a mano. */
const WORK_ROW_COUNT = 4;
const WORK_ROW_MIN_HEIGHT = 12;
const WORK_ROW_TARGET_HEIGHT = 18;

/**
 * Padding verticale delle righe: e' la leva con cui lo spazio che avanza viene
 * ridistribuito su tutte le sezioni invece di gonfiare solo "Lavoro eseguito".
 */
const ROW_PADDING_MIN = 2.5;
const ROW_PADDING_MAX = 8;

const CONTENT_END_ID = "reportContentEnd";

type MeasuredNode = {
    id?: string;
    startPosition?: { top: number; pageNumber: number };
};

type MeasureCallback = (top: number, pageNumber: number) => void;

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

export type CustomerReportSummaryItem = {
    id: number;
    createdAtLabel: string;
    deviceName: string;
    issueDescription: string;
    closed: boolean;
    alerted: boolean;
    paymentMethod: "non_paid" | "cash" | "card";
    totalPrice: number;
};

export type CustomerReportsPrintData = {
    customerId: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    labName: string;
    labEmail: string;
    labAddress: string;
    labPhone: string;
    labLogoUrl: string;
    rangeLabel?: string;
    reportCount: number;
    reports: CustomerReportSummaryItem[];
};

const pdfmakeRoot = path.dirname(require.resolve("pdfmake/package.json"));

const fontDescriptors = {
    Roboto: {
        normal: path.join(pdfmakeRoot, "fonts", "Roboto", "Roboto-Regular.ttf"),
        bold: path.join(pdfmakeRoot, "fonts", "Roboto", "Roboto-Medium.ttf"),
        italics: path.join(pdfmakeRoot, "fonts", "Roboto", "Roboto-Italic.ttf"),
        bolditalics: path.join(pdfmakeRoot, "fonts", "Roboto", "Roboto-MediumItalic.ttf"),
    },
};

pdfmake.addFonts(fontDescriptors);

const yesNo = (value: boolean) => (value ? "Si" : "No");

const formatPaymentMethod = (value: CustomerReportSummaryItem["paymentMethod"]) => {
    if (value === "cash") {
        return "Contanti";
    }

    if (value === "card") {
        return "Carta";
    }

    return "Non pagato";
};

const formatEuro = (value: number) =>
    new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);

const formatOptionalEuro = (value: number) => (Number.isFinite(value) && value > 0 ? formatEuro(value) : "");

const tableLayout = {
    hLineWidth: () => 1,
    vLineWidth: () => 1,
    hLineColor: () => "#111",
    vLineColor: () => "#111",
    paddingLeft: () => 5,
    paddingRight: () => 5,
    paddingTop: () => 4,
    paddingBottom: () => 4,
};

// Il report singolo stampa due copie sulla stessa pagina: serve un passo piu' stretto
// delle tabelle di resoconto, poi allargato quanto serve per riempire il foglio.
const reportTableLayout = (rowPadding: number) => ({
    ...tableLayout,
    paddingTop: () => rowPadding,
    paddingBottom: () => rowPadding,
});

// Le righe da compilare a mano: font minimo cosi' l'altezza naturale non fa da pavimento
// e la loro altezza resta governata da `heights`.
const emptyCell = () => ({ text: "", fontSize: 1, margin: [0, 0, 0, 0] });

const buildFilledCell = (value: string) => ({
    text: value,
    alignment: "center" as const,
    bold: true,
    margin: [0, 13, 0, 13],
});

const cashIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2A75B9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M5 10.5h1" />
    <path d="M18 13.5h1" />
</svg>`;

const cardIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2A75B9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
    <path d="M6 14h4" />
    <path d="M6 16h2.5" />
</svg>`;

const euroIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2A75B9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.5 6.8a6.6 6.6 0 1 0 0 10.4" />
    <path d="M4.5 10.5h9.5" />
    <path d="M4.5 13.5h8.5" />
</svg>`;

const sectionBarRow = (title: string, colSpan: number) => {
    const row = new Array(colSpan).fill({});
    row[0] = { text: title, style: "sectionBar", colSpan, alignment: "center", fillColor: "#E7ECF3" };
    return row;
};

const dualFieldRow = (label1: string, value1: string, label2: string, value2: string) => [
    { text: label1, style: "label" },
    { text: value1, style: "value" },
    { text: label2, style: "label" },
    { text: value2, style: "value" },
];

const fullWidthRow = (text: string, style: string, margin: number[]) => [
    { text, style, colSpan: 4, margin },
    {},
    {},
    {},
];

const buildReportMetaBlock = (report: ReportPrintData) => ({
    table: {
        widths: [120],
        body: [
            [
                {
                    stack: [
                        { text: `Rapporto #${report.id}`, style: "metaTitle", alignment: "right" },
                        { text: report.createdAtLabel, style: "metaDate", alignment: "right" },
                    ],
                },
            ],
        ],
    },
    layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => "#2A75B9",
        vLineColor: () => "#2A75B9",
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 4,
        paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 0],
});

const buildHeader = (report: ReportPrintData, logoDataUrl: string | null, compact = false) => ({
    columns: compact
        ? [
              {
                  width: "*",
                  text: "",
              },
              {
                  width: "auto",
                  ...buildReportMetaBlock(report),
              },
          ]
        : [
              {
                  width: "*",
                  columns: [
                      ...(logoDataUrl
                          ? [{ width: 56, image: logoDataUrl, fit: [52, 52], margin: [0, 0, 0, 0] }]
                          : [{ width: 56, text: "" }]),
                      {
                          width: "*",
                          stack: [
                              { text: report.labName, style: "brandName" },
                              {
                                  text: `${report.labAddress}\n${report.labEmail}\n${report.labPhone}`,
                                  style: "brandInfo",
                              },
                          ],
                          margin: [0, 0, 0, 0],
                      },
                  ],
              },
              {
                  width: "auto",
                  ...buildReportMetaBlock(report),
              },
          ],
    columnGap: 12,
    margin: [0, 0, 0, 5],
});

const buildCustomerSummaryMetaBlock = (customer: CustomerReportsPrintData) => ({
    table: {
        widths: [140],
        body: [
            [
                {
                    stack: [
                        { text: `Cliente #${customer.customerId}`, style: "metaTitle", alignment: "right" },
                        ...(customer.rangeLabel
                            ? [{ text: customer.rangeLabel, style: "metaDate", alignment: "right" as const }]
                            : []),
                        { text: `${customer.reportCount} report`, style: "metaDate", alignment: "right" },
                    ],
                },
            ],
        ],
    },
    layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => "#2A75B9",
        vLineColor: () => "#2A75B9",
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 4,
        paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 0],
});

const buildCustomerSummaryHeader = (customer: CustomerReportsPrintData, logoDataUrl: string | null) => ({
    columns: [
        {
            width: "*",
            columns: [
                ...(logoDataUrl
                    ? [{ width: 56, image: logoDataUrl, fit: [52, 52], margin: [0, 0, 0, 0] }]
                    : [{ width: 56, text: "" }]),
                {
                    width: "*",
                    stack: [
                        { text: customer.labName, style: "brandName" },
                        {
                            text: `${customer.labAddress}\n${customer.labEmail}\n${customer.labPhone}`,
                            style: "brandInfo",
                        },
                    ],
                    margin: [0, 0, 0, 0],
                },
            ],
        },
        {
            width: "auto",
            ...buildCustomerSummaryMetaBlock(customer),
        },
    ],
    columnGap: 12,
    margin: [0, 0, 0, 8],
});

const buildCustomerSummaryInfoSection = (customer: CustomerReportsPrintData) => ({
    table: {
        widths: [90, "*", 90, "*"],
        body: [
            sectionBarRow("CLIENTE", 4),
            dualFieldRow("Cliente", customer.customerName, "Telefono", customer.customerPhone),
            // L'email prende tutta la riga: e' un token che non va a capo e in mezza
            // colonna costringerebbe la tabella a sforare il margine destro.
            // Il numero di report e' gia' nel riquadro in alto.
            [
                { text: "Email", style: "label" },
                { text: customer.customerEmail || "-", style: "value", colSpan: 3 },
                {},
                {},
            ],
        ],
    },
    layout: tableLayout,
    margin: [0, 0, 0, 8],
});

type ReportsTableCell = {
    text?: string;
    style?: string;
    colSpan?: number;
    alignment?: "left" | "center" | "right";
    italics?: boolean;
    bold?: boolean;
    fontSize?: number;
    margin?: number[];
    fillColor?: string;
};

const buildCustomerReportsTable = (reports: CustomerReportSummaryItem[]) => {
    const body: ReportsTableCell[][] = [
        sectionBarRow("RESOCONTO REPORT", 7),
        [
            { text: "#", style: "summaryHeader" },
            { text: "Data", style: "summaryHeader" },
            { text: "Dispositivo", style: "summaryHeader" },
            { text: "Problema", style: "summaryHeader" },
            { text: "Stato", style: "summaryHeader" },
            { text: "Pagamento", style: "summaryHeader" },
            { text: "Totale", style: "summaryHeader" },
        ],
    ];

    if (reports.length === 0) {
        body.push([
            { text: "Nessun report disponibile", colSpan: 7, alignment: "center", italics: true, margin: [0, 8, 0, 8] },
            {},
            {},
            {},
            {},
            {},
            {},
        ]);
    } else {
        for (const report of reports) {
            body.push([
                { text: String(report.id), alignment: "center", bold: true },
                { text: report.createdAtLabel, alignment: "center" },
                { text: report.deviceName, bold: true },
                { text: report.issueDescription, fontSize: 8.5 },
                { text: report.closed ? "Chiuso" : "Aperto", alignment: "center" },
                { text: formatPaymentMethod(report.paymentMethod), alignment: "center" },
                { text: formatEuro(report.totalPrice), alignment: "right", bold: true },
            ]);
        }

        const totalAmount = reports.reduce((sum, report) => sum + report.totalPrice, 0);
        body.push([
            { text: "Totale complessivo", colSpan: 6, alignment: "right", bold: true, fillColor: "#F4F8FD" },
            {},
            {},
            {},
            {},
            {},
            { text: formatEuro(totalAmount), alignment: "right", bold: true, fillColor: "#F4F8FD" },
        ]);
    }

    return {
        table: {
            // Barra di sezione + intestazione colonne: entrambe si ripetono a ogni pagina.
            headerRows: 2,
            widths: [28, 56, 92, "*", 56, 68, 68],
            body,
        },
        layout: tableLayout,
    };
};

const sectionMargin = (compact: boolean) => (compact ? [0, 0, 0, 4] : [0, 0, 0, 5]);

const buildCustomerSection = (report: ReportPrintData, rowPadding: number, compact = false) => ({
    table: {
        widths: [90, "*", 90, "*"],
        body: [
            sectionBarRow("CLIENTE", 4),
            dualFieldRow("Cliente", report.customerName, "Telefono", report.customerPhone),
        ],
    },
    layout: reportTableLayout(rowPadding),
    margin: sectionMargin(compact),
});

const buildDeviceSection = (report: ReportPrintData, rowPadding: number, compact = false) => ({
    table: {
        widths: [90, "*", 90, "*"],
        body: [
            sectionBarRow("DISPOSITIVO", 4),
            dualFieldRow("Dispositivo", report.deviceName, "Password", report.password),
            dualFieldRow("Backup dati", yesNo(report.dataBackup), "Alimentatore", yesNo(report.charger)),
        ],
    },
    layout: reportTableLayout(rowPadding),
    margin: sectionMargin(compact),
});

const buildDetailsSection = (report: ReportPrintData, rowPadding: number, compact = false) => ({
    table: {
        widths: [90, "*", 90, "*"],
        body: [
            sectionBarRow("DETTAGLI", 4),
            fullWidthRow("Problema riscontrato", "label", [0, 1, 0, 0]),
            fullWidthRow(report.issueDescription, "value", [0, 0, 0, 1]),
            fullWidthRow("Note", "label", [0, 1, 0, 0]),
            fullWidthRow(report.note, "value", [0, 0, 0, 1]),
        ],
    },
    layout: reportTableLayout(rowPadding),
    margin: sectionMargin(compact),
});

// Avvertenza sui tempi di ritiro: va solo sulla copia che resta al cliente.
const buildRetentionNoticeSection = () => ({
    text: "I dispositivi vanno ritirati dal cliente entro 60gg dalla consegna (anche quelli non riparati), dopo tale termine il laboratorio non risponde di eventuali smarrimenti degli stessi.",
    style: "fineprint",
    margin: [0, 0, 0, 4],
});

const buildWorkSection = (rowHeight: number, rowPadding: number) => ({
    table: {
        widths: ["*"],
        // La prima riga e' la barra di sezione, le altre restano vuote da compilare a mano.
        heights: (row: number) => (row === 0 ? "auto" : rowHeight),
        body: [sectionBarRow("LAVORO ESEGUITO", 1), ...Array.from({ length: WORK_ROW_COUNT }, () => [emptyCell()])],
    },
    layout: reportTableLayout(rowPadding),
    margin: [0, 0, 0, 5],
});

const boxedTable = (title: string, cell: object, rowPadding: number) => ({
    table: {
        widths: ["*"],
        heights: (row: number) => (row === 0 ? "auto" : 42),
        body: [sectionBarRow(title, 1), [cell]],
    },
    layout: reportTableLayout(rowPadding),
});

const paymentIconCell = (iconSvg: string, label: string) => ({
    stack: [
        { svg: iconSvg, width: 26, height: 26, alignment: "center", margin: [0, 1, 0, 2] },
        { text: label, style: "paymentLabel", alignment: "center" },
    ],
});

const buildAmountCell = (report: ReportPrintData) => ({
    columns: [
        // Icona ancorata al bordo sinistro, importo centrato nello spazio restante.
        { width: 26, stack: [{ svg: euroIconSvg, width: 26, height: 26 }] },
        {
            width: "*",
            text: formatOptionalEuro(report.totalPrice),
            bold: true,
            alignment: "center",
            margin: [0, 6, 0, 0],
        },
    ],
    margin: [0, 8, 0, 8],
});

const buildNotesAndPaymentSection = (report: ReportPrintData, rowPadding: number) => ({
    columns: [
        {
            width: "33%",
            ...boxedTable("AVVISATO", buildFilledCell(report.alerted ? yesNo(report.alerted) : ""), rowPadding),
        },
        {
            width: "33%",
            ...boxedTable("IMPORTO", buildAmountCell(report), rowPadding),
        },
        {
            width: "34%",
            table: {
                widths: ["*", "*"],
                heights: (row: number) => (row === 0 ? "auto" : 42),
                body: [
                    sectionBarRow("PAGAMENTO", 2),
                    [paymentIconCell(cashIconSvg, "Contanti"), paymentIconCell(cardIconSvg, "Carta")],
                ],
            },
            layout: reportTableLayout(rowPadding),
        },
    ],
    columnGap: 10,
});

const loadImageDataUrl = async (imageUrl: string) => {
    try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            return null;
        }

        const contentType = response.headers.get("content-type") ?? "image/png";
        const buffer = Buffer.from(await response.arrayBuffer());
        return `data:${contentType};base64,${buffer.toString("base64")}`;
    } catch {
        return null;
    }
};

const createSectionedReportPdfBuffer = async (report: ReportPrintData, logoDataUrl: string | null) => {
    const copyBlock = (rowPadding: number, compact: boolean) => [
        buildHeader(report, logoDataUrl, compact),
        buildCustomerSection(report, rowPadding, compact),
        buildDeviceSection(report, rowPadding, compact),
        buildDetailsSection(report, rowPadding, compact),
        ...(compact ? [] : [buildRetentionNoticeSection()]),
    ];

    const buildDocumentDefinition = (workRowHeight: number, rowPadding: number, onMeasure?: MeasureCallback) => ({
        pageSize: "A4",
        pageMargins: [PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN, PAGE_MARGIN],
        defaultStyle: {
            font: "Roboto",
            fontSize: 10,
            color: "#111111",
        },
        // Mai forzare interruzioni: l'hook serve solo a leggere dove finisce il contenuto.
        pageBreakBefore: (currentNode: MeasuredNode) => {
            if (currentNode.id === CONTENT_END_ID && currentNode.startPosition) {
                onMeasure?.(currentNode.startPosition.top, currentNode.startPosition.pageNumber);
            }

            return false;
        },
        content: [
            ...copyBlock(rowPadding, false),
            {
                canvas: [
                    {
                        type: "line",
                        x1: 0,
                        y1: 0,
                        x2: 555,
                        y2: 0,
                        lineWidth: 1,
                        dash: { length: 4, space: 3 },
                    },
                ],
                margin: [0, 6, 0, 8],
            },
            ...copyBlock(rowPadding, true),
            buildWorkSection(workRowHeight, rowPadding),
            buildNotesAndPaymentSection(report, rowPadding),
            // Sentinella invisibile: la sua posizione di partenza e' la fine del contenuto.
            // Solo nella passata di misura: nel PDF finale il contenuto arriva a filo pagina
            // e questo nodo, per quanto minuscolo, aprirebbe una seconda pagina vuota.
            ...(onMeasure ? [{ id: CONTENT_END_ID, text: " ", fontSize: 1, margin: [0, 0, 0, 0] }] : []),
        ],
        styles: {
            brandName: {
                fontSize: 15,
                bold: true,
                color: "#2A75B9",
            },
            brandInfo: {
                fontSize: 10.5,
                lineHeight: 1.25,
            },
            metaTitle: {
                fontSize: 13,
                bold: true,
                color: "#2A75B9",
            },
            metaDate: {
                fontSize: 10.5,
            },
            sectionBar: {
                fontSize: 10.5,
                bold: true,
                color: "#2A75B9",
            },
            label: {
                fontSize: 9,
                color: "#555555",
            },
            value: {
                fontSize: 11.75,
                bold: true,
            },
            paymentLabel: {
                fontSize: 9,
                color: "#555555",
            },
            fineprint: {
                fontSize: 7.5,
                italics: true,
                color: "#555555",
            },
        },
    });

    // Impagina una volta e restituisce dove finisce il contenuto (null se sborda di pagina).
    const measureContentBottom = async (workRowHeight: number, rowPadding: number) => {
        let bottom: number | null = null;
        await pdfmake
            .createPdf(
                buildDocumentDefinition(workRowHeight, rowPadding, (top, pageNumber) => {
                    bottom = pageNumber === 1 ? top : null;
                })
            )
            .getBuffer();

        return bottom as number | null;
    };

    // Righe di lavoro all'altezza voluta: quello che avanza va allargato sul resto.
    const baseBottom = await measureContentBottom(WORK_ROW_TARGET_HEIGHT, ROW_PADDING_MIN);

    let workRowHeight = WORK_ROW_MIN_HEIGHT;
    let rowPadding = ROW_PADDING_MIN;

    if (baseBottom !== null) {
        workRowHeight = WORK_ROW_TARGET_HEIGHT;
        // Un punto di margine perche' un arrotondamento non spinga l'ultima riga oltre il bordo.
        const slack = PAGE_HEIGHT - PAGE_MARGIN - baseBottom - 1;

        if (slack > 0) {
            // Quanto costa un punto di padding va misurato, non stimato: dipende da quante
            // righe ci sono e da quali hanno un'altezza fissa che se lo assorbe. La sonda
            // toglie padding invece di aggiungerne: cosi' non puo' sforare di pagina e
            // restituire null proprio quando il foglio e' quasi pieno.
            const probeBottom = await measureContentBottom(WORK_ROW_TARGET_HEIGHT, ROW_PADDING_MIN - 1);
            const costPerPaddingPoint = probeBottom === null ? 0 : baseBottom - probeBottom;

            if (costPerPaddingPoint > 0) {
                const wanted = slack / costPerPaddingPoint;
                rowPadding = ROW_PADDING_MIN + Math.min(wanted, ROW_PADDING_MAX - ROW_PADDING_MIN);
            }

            // Se il padding da solo non basta (o e' arrivato al tetto), il resto lo
            // assorbono le righe di "Lavoro eseguito".
            const leftover = slack - (rowPadding - ROW_PADDING_MIN) * costPerPaddingPoint;

            if (leftover > 0) {
                workRowHeight += leftover / WORK_ROW_COUNT;
            }
        }
    }

    return await pdfmake.createPdf(buildDocumentDefinition(workRowHeight, rowPadding)).getBuffer();
};

export const createReportPdfBuffer = async (report: ReportPrintData) => {
    const logoDataUrl = await loadImageDataUrl(report.labLogoUrl);

    return await createSectionedReportPdfBuffer(report, logoDataUrl);
};

export const createCustomerReportsPdfBuffer = async (customer: CustomerReportsPrintData) => {
    const logoDataUrl = await loadImageDataUrl(customer.labLogoUrl);

    const documentDefinition = {
        pageSize: "A4",
        pageMargins: [14, 14, 14, 14],
        defaultStyle: {
            font: "Roboto",
            fontSize: 10,
            color: "#111111",
        },
        content: [
            buildCustomerSummaryHeader(customer, logoDataUrl),
            buildCustomerSummaryInfoSection(customer),
            buildCustomerReportsTable(customer.reports),
        ],
        styles: {
            brandName: {
                fontSize: 15,
                bold: true,
                color: "#2A75B9",
            },
            brandInfo: {
                fontSize: 10.5,
                lineHeight: 1.25,
            },
            metaTitle: {
                fontSize: 13,
                bold: true,
                color: "#2A75B9",
            },
            metaDate: {
                fontSize: 10.5,
            },
            sectionBar: {
                fontSize: 10.5,
                bold: true,
                color: "#2A75B9",
            },
            label: {
                fontSize: 9,
                color: "#555555",
            },
            value: {
                fontSize: 11.75,
                bold: true,
            },
            summaryHeader: {
                fontSize: 9,
                bold: true,
                color: "#2A75B9",
            },
            paymentLabel: {
                fontSize: 9,
                color: "#555555",
            },
        },
    };

    const pdfDocument = pdfmake.createPdf(documentDefinition);

    return await pdfDocument.getBuffer();
};
