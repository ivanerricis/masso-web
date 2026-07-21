import path from "node:path";
import pdfmake from "pdfmake";

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

const emptyCell = () => ({ text: "", margin: [0, 6, 0, 6] });

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

const pairRow = (label: string, value: string) => [
    { text: label, style: "label" },
    { text: value, style: "value" },
];

const buildGridTable = (rows: Array<[string, string]>) => ({
    table: {
        widths: [120, "*"],
        body: rows.map((row) => pairRow(row[0], row[1])),
    },
    layout: tableLayout,
    margin: [0, 0, 0, 7],
});

const buildReportMetaBlock = (report: ReportPrintData) => ({
    table: {
        widths: [120],
        body: [[
            {
                stack: [
                    { text: `Rapporto #${report.id}`, style: "metaTitle", alignment: "right" },
                    { text: report.createdAtLabel, style: "metaDate", alignment: "right" },
                ],
            },
        ]],
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
                          ? [{ width: 40, image: logoDataUrl, fit: [36, 36], margin: [0, 0, 0, 0] }]
                          : [{ width: 40, text: "" }]),
                      {
                          width: "*",
                          stack: [
                              { text: report.labName, style: "brandName" },
                              { text: `${report.labAddress}\n${report.labEmail}\n${report.labPhone}`, style: "brandInfo" },
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
    margin: [0, 0, 0, 8],
});

const buildCustomerSummaryMetaBlock = (customer: CustomerReportsPrintData) => ({
    table: {
        widths: [140],
        body: [[
            {
                stack: [
                    { text: `Cliente #${customer.customerId}`, style: "metaTitle", alignment: "right" },
                    { text: `${customer.reportCount} report`, style: "metaDate", alignment: "right" },
                ],
            },
        ]],
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

const buildCustomerSummaryHeader = (customer: CustomerReportsPrintData, logoDataUrl: string | null, compact = false) => ({
    columns: compact
        ? [
              {
                  width: "*",
                  text: "",
              },
              {
                  width: "auto",
                  ...buildCustomerSummaryMetaBlock(customer),
              },
          ]
        : [
              {
                  width: "*",
                  columns: [
                      ...(logoDataUrl
                          ? [{ width: 40, image: logoDataUrl, fit: [36, 36], margin: [0, 0, 0, 0] }]
                          : [{ width: 40, text: "" }]),
                      {
                          width: "*",
                          stack: [
                              { text: customer.labName, style: "brandName" },
                              { text: `${customer.labAddress}\n${customer.labEmail}\n${customer.labPhone}`, style: "brandInfo" },
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

const buildCustomerSummaryInfoSection = (customer: CustomerReportsPrintData, compact = false) => ({
    stack: [
        { text: "Cliente", style: "sectionTitle", margin: [0, 0, 0, 3] },
        {
            table: {
                widths: [112, "*", 128, "*"],
                body: [[
                    { text: "Nome", style: "label" },
                    { text: customer.customerName, style: "value" },
                    { text: "Telefono", style: "label" },
                    { text: customer.customerPhone, style: "value" },
                ], [
                    { text: "Email", style: "label" },
                    { text: customer.customerEmail || "-", style: "value" },
                    { text: "Report", style: "label" },
                    { text: String(customer.reportCount), style: "value" },
                ]],
            },
            layout: tableLayout,
        },
    ],
    margin: compact ? [0, 0, 0, 6] : [0, 0, 0, 8],
});

const buildCustomerReportsTable = (reports: CustomerReportSummaryItem[]) => {
    const body = [
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
            headerRows: 1,
            widths: [28, 56, 92, "*", 56, 68, 68],
            body,
        },
        layout: tableLayout,
    };
};

const buildSection = (title: string, rows: Array<[string, string]>, compact = false) => ({
    stack: [
        { text: title, style: "sectionTitle", margin: [0, 0, 0, 3] },
        buildGridTable(rows),
    ],
    margin: compact ? [0, 0, 0, 6] : [0, 0, 0, 8],
});

const buildStateSection = (report: ReportPrintData, compact = false) => ({
    stack: [
        { text: "Stato", style: "sectionTitle", margin: [0, 0, 0, 3] },
        {
            table: {
                widths: [112, "*", 128, "*"],
                body: [
                    [
                        { text: "Backup dati", style: "label" },
                        { text: yesNo(report.dataBackup), style: "value" },
                        { text: "Alimentatore", style: "label" },
                        { text: yesNo(report.charger), style: "value" },
                    ],
                ],
            },
            layout: tableLayout,
        },
    ],
    margin: compact ? [0, 0, 0, 6] : [0, 0, 0, 8],
});

const buildCustomerSection = (report: ReportPrintData, compact = false) => ({
    stack: [
        { text: "Cliente", style: "sectionTitle", margin: [0, 0, 0, 3] },
        {
            table: {
                widths: [112, "*", 128, "*"],
                body: [[
                    { text: "Nome", style: "label" },
                    { text: report.customerName, style: "value" },
                    { text: "Telefono", style: "label" },
                    { text: report.customerPhone, style: "value" },
                ]],
            },
            layout: tableLayout,
        },
    ],
    margin: compact ? [0, 0, 0, 6] : [0, 0, 0, 8],
});

const buildWorkSection = () => ({
    stack: [
        { text: "Lavoro eseguito", style: "sectionTitle", margin: [0, 0, 0, 3] },
        {
            table: {
                widths: ["*"],
                body: [[emptyCell()], [emptyCell()], [emptyCell()]],
            },
            layout: tableLayout,
            heights: [18, 18, 18],
        },
    ],
    margin: [0, 0, 0, 8],
});

const buildNotesAndPaymentSection = (report: ReportPrintData) => ({
    columns: [
        {
            width: "33%",
            stack: [
                { text: "Avvisato", style: "sectionTitle", margin: [0, 0, 0, 3] },
                {
                    table: { widths: ["*"], body: [[buildFilledCell(report.alerted ? yesNo(report.alerted) : "")]] },
                    layout: tableLayout,
                    heights: [46],
                },
            ],
        },
        {
            width: "33%",
            stack: [
                { text: "Importo totale", style: "sectionTitle", margin: [0, 0, 0, 3] },
                { table: { widths: ["*"], body: [[buildFilledCell(formatOptionalEuro(report.totalPrice))]] }, layout: tableLayout, heights: [46] },
            ],
        },
        {
            width: "34%",
            stack: [
                { text: "Pagamento", style: "sectionTitle", margin: [0, 0, 0, 3] },
                {
                    columns: [
                        {
                            width: "48%",
                            table: {
                                widths: ["*"],
                                body: [[
                                    {
                                        stack: [
                                            { svg: cashIconSvg, width: 26, height: 26, alignment: "center", margin: [0, 1, 0, 2] },
                                            { text: "Contanti", style: "paymentLabel", alignment: "center" },
                                        ],
                                    },
                                ]],
                            },
                            layout: tableLayout,
                        },
                        {
                            width: "48%",
                            table: {
                                widths: ["*"],
                                body: [[
                                    {
                                        stack: [
                                            { svg: cardIconSvg, width: 26, height: 26, alignment: "center", margin: [0, 1, 0, 2] },
                                            { text: "Carta", style: "paymentLabel", alignment: "center" },
                                        ],
                                    },
                                ]],
                            },
                            layout: tableLayout,
                        },
                    ],
                    columnGap: 6,
                },
            ],
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

export const createReportPdfBuffer = async (report: ReportPrintData) => {
    const logoDataUrl = await loadImageDataUrl(report.labLogoUrl);

    const copyBlock = (compact: boolean) => [
        buildHeader(report, logoDataUrl, compact),
        buildCustomerSection(report, compact),
        buildSection("Dispositivo", [
            ["Nome", report.deviceName],
        ], compact),
        buildSection("Dettagli", [
            ["Problema", report.issueDescription],
            ["Password", report.password],
            ["Note", report.note],
        ], compact),
        buildStateSection(report, compact),
    ];

    const documentDefinition = {
        pageSize: "A4",
        pageMargins: [14, 14, 14, 14],
        defaultStyle: {
            font: "Roboto",
            fontSize: 10,
            color: "#111111",
        },
        content: [
            ...copyBlock(false),
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
                margin: [0, 4, 0, 6],
            },
            ...copyBlock(true),
            buildWorkSection(),
            buildNotesAndPaymentSection(report),
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
            sectionTitle: {
                fontSize: 11,
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
        },
    };

    const pdfDocument = pdfmake.createPdf(documentDefinition);

    return await pdfDocument.getBuffer();
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
            buildCustomerSummaryHeader(customer, logoDataUrl, false),
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
                margin: [0, 4, 0, 6],
            },
            buildCustomerSummaryHeader(customer, logoDataUrl, true),
            buildCustomerSummaryInfoSection(customer),
            {
                stack: [
                    { text: "Resoconto report", style: "sectionTitle", margin: [0, 0, 0, 3] },
                    buildCustomerReportsTable(customer.reports),
                ],
            },
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
            sectionTitle: {
                fontSize: 11,
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