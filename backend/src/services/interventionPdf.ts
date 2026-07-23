import path from "node:path";
import pdfmake from "pdfmake";

export type InterventionType = "consegna_materiale" | "intervento_sede" | "intervento_remoto";
export type InterventionStatus = "programmato" | "in_lavorazione" | "completato";

export type InterventionPrintData = {
    id: number;
    labName: string;
    labEmail: string;
    labAddress: string;
    labPhone: string;
    labLogoUrl: string;
    customerName: string;
    customerPhone: string;
    collaboratorName: string;
    type: InterventionType;
    status: InterventionStatus;
    description: string;
    interventionDateLabel: string | null;
    startTime: string | null;
    endTime: string | null;
    createdAtLabel: string;
};

export type CustomerInterventionSummaryItem = {
    id: number;
    createdAtLabel: string;
    type: InterventionType;
    status: InterventionStatus;
    description: string;
    scheduleLabel: string | null;
};

export type CustomerInterventionsPrintData = {
    customerId: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    labName: string;
    labEmail: string;
    labAddress: string;
    labPhone: string;
    labLogoUrl: string;
    interventionCount: number;
    interventions: CustomerInterventionSummaryItem[];
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

const formatInterventionType = (value: InterventionType) => {
    if (value === "consegna_materiale") {
        return "Consegna materiale";
    }

    if (value === "intervento_sede") {
        return "Intervento in sede";
    }

    return "Intervento da remoto";
};

const formatInterventionStatus = (value: InterventionStatus) => {
    if (value === "in_lavorazione") {
        return "In lavorazione";
    }

    if (value === "completato") {
        return "Completato";
    }

    return "Programmato";
};

const formatTime = (value: string | null) => (value ? value.slice(0, 5) : "-");

const descriptionLabel = (type: InterventionType) =>
    type === "consegna_materiale" ? "Materiali consegnati" : "Assistenza effettuata";

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

const buildSection = (title: string, rows: Array<[string, string]>) => ({
    stack: [
        { text: title, style: "sectionTitle", margin: [0, 0, 0, 3] },
        buildGridTable(rows),
    ],
    margin: [0, 0, 0, 8],
});

const buildMetaBlock = (intervention: InterventionPrintData) => ({
    table: {
        widths: [130],
        body: [[
            {
                stack: [
                    { text: `Intervento #${intervention.id}`, style: "metaTitle", alignment: "right" },
                    { text: intervention.createdAtLabel, style: "metaDate", alignment: "right" },
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

const buildHeader = (intervention: InterventionPrintData, logoDataUrl: string | null) => ({
    columns: [
        {
            width: "*",
            columns: [
                ...(logoDataUrl
                    ? [{ width: 40, image: logoDataUrl, fit: [36, 36], margin: [0, 0, 0, 0] }]
                    : [{ width: 40, text: "" }]),
                {
                    width: "*",
                    stack: [
                        { text: intervention.labName, style: "brandName" },
                        { text: `${intervention.labAddress}\n${intervention.labEmail}\n${intervention.labPhone}`, style: "brandInfo" },
                    ],
                    margin: [0, 0, 0, 0],
                },
            ],
        },
        {
            width: "auto",
            ...buildMetaBlock(intervention),
        },
    ],
    columnGap: 12,
    margin: [0, 0, 0, 10],
});

const buildCustomerSection = (intervention: InterventionPrintData) => ({
    stack: [
        { text: "Cliente e collaboratore", style: "sectionTitle", margin: [0, 0, 0, 3] },
        {
            table: {
                widths: [112, "*", 112, "*"],
                body: [[
                    { text: "Cliente", style: "label" },
                    { text: intervention.customerName, style: "value" },
                    { text: "Telefono", style: "label" },
                    { text: intervention.customerPhone, style: "value" },
                ], [
                    { text: "Collaboratore", style: "label" },
                    { text: intervention.collaboratorName, style: "value" },
                    { text: "Tipo intervento", style: "label" },
                    { text: formatInterventionType(intervention.type), style: "value" },
                ]],
            },
            layout: tableLayout,
        },
    ],
    margin: [0, 0, 0, 8],
});

const buildScheduleSection = (intervention: InterventionPrintData) => {
    if (intervention.type === "consegna_materiale") {
        return null;
    }

    return buildSection("Tempo di assistenza", [
        ["Data intervento", intervention.interventionDateLabel ?? "-"],
        ["Ora inizio", formatTime(intervention.startTime)],
        ["Ora fine", formatTime(intervention.endTime)],
    ]);
};

const buildStatusSection = (intervention: InterventionPrintData) => ({
    stack: [
        { text: "Stato", style: "sectionTitle", margin: [0, 0, 0, 3] },
        {
            table: {
                widths: ["*"],
                body: [[
                    {
                        text: formatInterventionStatus(intervention.status),
                        alignment: "center",
                        bold: true,
                        margin: [0, 8, 0, 8],
                    },
                ]],
            },
            layout: tableLayout,
        },
    ],
    margin: [0, 0, 0, 8],
});

const buildDescriptionSection = (intervention: InterventionPrintData) => ({
    stack: [
        { text: descriptionLabel(intervention.type), style: "sectionTitle", margin: [0, 0, 0, 3] },
        {
            table: {
                widths: ["*"],
                body: [[{ text: intervention.description, margin: [0, 6, 0, 6] }]],
            },
            layout: tableLayout,
        },
    ],
    margin: [0, 0, 0, 8],
});

const buildSignatureSection = () => ({
    columns: [
        {
            width: "*",
            text: "",
        },
        {
            width: 220,
            stack: [
                { text: "Firma del cliente", style: "sectionTitle", alignment: "center", margin: [0, 0, 0, 28] },
                {
                    canvas: [
                        { type: "line", x1: 0, y1: 0, x2: 220, y2: 0, lineWidth: 1, lineColor: "#111" },
                    ],
                },
            ],
        },
    ],
    margin: [0, 24, 0, 0],
});

const buildCustomerSummaryMetaBlock = (customer: CustomerInterventionsPrintData) => ({
    table: {
        widths: [140],
        body: [[
            {
                stack: [
                    { text: `Cliente #${customer.customerId}`, style: "metaTitle", alignment: "right" },
                    { text: `${customer.interventionCount} interventi`, style: "metaDate", alignment: "right" },
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

const buildCustomerSummaryHeader = (customer: CustomerInterventionsPrintData, logoDataUrl: string | null) => ({
    columns: [
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

const buildCustomerSummaryInfoSection = (customer: CustomerInterventionsPrintData) => ({
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
                    { text: "Interventi", style: "label" },
                    { text: String(customer.interventionCount), style: "value" },
                ]],
            },
            layout: tableLayout,
        },
    ],
    margin: [0, 0, 0, 8],
});

type SummaryTableCell = {
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

const buildCustomerInterventionsTable = (interventions: CustomerInterventionSummaryItem[]) => {
    const body: SummaryTableCell[][] = [
        [
            { text: "#", style: "summaryHeader" },
            { text: "Creato il", style: "summaryHeader" },
            { text: "Tipo", style: "summaryHeader" },
            { text: "Descrizione", style: "summaryHeader" },
            { text: "Data/Orario", style: "summaryHeader" },
            { text: "Stato", style: "summaryHeader" },
        ],
    ];

    if (interventions.length === 0) {
        body.push([
            { text: "Nessun intervento disponibile", colSpan: 6, alignment: "center", italics: true, margin: [0, 8, 0, 8] },
            {},
            {},
            {},
            {},
            {},
        ]);
    } else {
        for (const intervention of interventions) {
            body.push([
                { text: String(intervention.id), alignment: "center", bold: true },
                { text: intervention.createdAtLabel, alignment: "center" },
                { text: formatInterventionType(intervention.type), bold: true },
                { text: intervention.description, fontSize: 8.5 },
                { text: intervention.scheduleLabel ?? "-", alignment: "center" },
                { text: formatInterventionStatus(intervention.status), alignment: "center" },
            ]);
        }
    }

    return {
        table: {
            headerRows: 1,
            widths: [22, 56, 76, "*", 100, 62],
            body,
        },
        layout: tableLayout,
    };
};

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

export const createInterventionPdfBuffer = async (intervention: InterventionPrintData) => {
    const logoDataUrl = await loadImageDataUrl(intervention.labLogoUrl);
    const scheduleSection = buildScheduleSection(intervention);

    const documentDefinition = {
        pageSize: "A4",
        pageMargins: [14, 14, 14, 14],
        defaultStyle: {
            font: "Roboto",
            fontSize: 10,
            color: "#111111",
        },
        content: [
            buildHeader(intervention, logoDataUrl),
            buildCustomerSection(intervention),
            ...(scheduleSection ? [scheduleSection] : []),
            buildStatusSection(intervention),
            buildDescriptionSection(intervention),
            buildSignatureSection(),
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
        },
    };

    const pdfDocument = pdfmake.createPdf(documentDefinition);

    return await pdfDocument.getBuffer();
};

export const createCustomerInterventionsPdfBuffer = async (customer: CustomerInterventionsPrintData) => {
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
            {
                stack: [
                    { text: "Resoconto interventi", style: "sectionTitle", margin: [0, 0, 0, 3] },
                    buildCustomerInterventionsTable(customer.interventions),
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
        },
    };

    const pdfDocument = pdfmake.createPdf(documentDefinition);

    return await pdfDocument.getBuffer();
};
