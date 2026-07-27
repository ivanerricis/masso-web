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
    customerEmail: string;
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
    rangeLabel?: string;
    interventionCount: number;
    interventions: CustomerInterventionSummaryItem[];
};

export type InterventionRangeSummaryItem = CustomerInterventionSummaryItem & {
    customerName: string;
};

export type InterventionsRangePrintData = {
    labName: string;
    labEmail: string;
    labAddress: string;
    labPhone: string;
    labLogoUrl: string;
    rangeLabel: string;
    interventionCount: number;
    interventions: InterventionRangeSummaryItem[];
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

const parseTimeToMinutes = (value: string | null) => {
    if (!value) {
        return null;
    }

    const [hours, minutes] = value.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return null;
    }

    return hours * 60 + minutes;
};

const formatHoursWorked = (startTime: string | null, endTime: string | null) => {
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);

    if (start == null || end == null || end <= start) {
        return null;
    }

    return ((end - start) / 60).toFixed(2).replace(".", ",");
};

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

const buildHeader = (intervention: InterventionPrintData, logoDataUrl: string | null) => ({
    columns: [
        logoDataUrl
            ? { width: 56, image: logoDataUrl, fit: [52, 52] }
            : { width: 56, text: "" },
        {
            width: "*",
            alignment: "right",
            stack: [
                { text: intervention.labName, style: "brandName", alignment: "right" },
                {
                    text: `${intervention.labAddress}\n${intervention.labEmail}\n${intervention.labPhone}`,
                    style: "brandInfo",
                    alignment: "right",
                },
            ],
        },
    ],
    columnGap: 12,
    margin: [0, 0, 0, 12],
});

const buildCustomerSection = (intervention: InterventionPrintData) => ({
    table: {
        widths: [90, "*", 90, "*"],
        body: [
            sectionBarRow("CLIENTE", 4),
            dualFieldRow("Cliente", intervention.customerName, "Telefono", intervention.customerPhone),
            dualFieldRow("Email", intervention.customerEmail || "-", "Collaboratore", intervention.collaboratorName),
        ],
    },
    layout: tableLayout,
    margin: [0, 0, 0, 8],
});

const buildActivitySection = (intervention: InterventionPrintData) => ({
    table: {
        widths: [90, "*", 90, "*"],
        body: [
            sectionBarRow("RAPPORTO ATTIVITÀ", 4),
            dualFieldRow("Codice", `#${intervention.id}`, "Data", intervention.interventionDateLabel ?? intervention.createdAtLabel),
            dualFieldRow("Tipologia", formatInterventionType(intervention.type), "Stato", formatInterventionStatus(intervention.status)),
            [
                { text: descriptionLabel(intervention.type), style: "label", colSpan: 4, margin: [0, 4, 0, 2] },
                {},
                {},
                {},
            ],
            [
                { text: intervention.description, style: "value", colSpan: 4, margin: [0, 0, 0, 4] },
                {},
                {},
                {},
            ],
        ],
    },
    layout: tableLayout,
    margin: [0, 0, 0, 8],
});

const buildTechnicianHoursSection = (intervention: InterventionPrintData) => {
    if (intervention.type === "consegna_materiale") {
        return null;
    }

    const scheduleLabel = intervention.interventionDateLabel
        ? `${intervention.interventionDateLabel} ${formatTime(intervention.startTime)} - ${formatTime(intervention.endTime)}`
        : "-";
    const hoursWorked = formatHoursWorked(intervention.startTime, intervention.endTime);

    return {
        table: {
            widths: [180, "*"],
            body: [
                sectionBarRow("ORE TECNICI", 2),
                [
                    { text: "Tecnico", style: "label" },
                    { text: "Orario", style: "label" },
                ],
                [
                    { text: intervention.collaboratorName, style: "value" },
                    { text: scheduleLabel, style: "value" },
                ],
                ...(hoursWorked
                    ? [[
                        { text: "Ore lavorate", style: "label" },
                        { text: hoursWorked, style: "value" },
                    ]]
                    : []),
            ],
        },
        layout: tableLayout,
        margin: [0, 0, 0, 8],
    };
};

const buildLegalNoticeSection = () => ({
    stack: [
        {
            text: "I dati del ricevente verranno trattati in base alla normativa europea UE 2016/679 del 27 aprile 2016 (GDPR).",
            style: "fineprint",
        },
        {
            text: "Si dichiara che i lavori sono stati eseguiti ed i materiali installati nel rispetto delle vigenti normative tecniche.",
            style: "fineprint",
            margin: [0, 2, 0, 0],
        },
    ],
    margin: [0, 4, 0, 0],
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
                    ...(customer.rangeLabel ? [{ text: customer.rangeLabel, style: "metaDate", alignment: "right" as const }] : []),
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
                    ? [{ width: 56, image: logoDataUrl, fit: [52, 52], margin: [0, 0, 0, 0] }]
                    : [{ width: 56, text: "" }]),
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

const buildRangeMetaBlock = (data: InterventionsRangePrintData) => ({
    table: {
        widths: [160],
        body: [[
            {
                stack: [
                    { text: "Resoconto interventi", style: "metaTitle", alignment: "right" },
                    { text: data.rangeLabel, style: "metaDate", alignment: "right" },
                    { text: `${data.interventionCount} interventi`, style: "metaDate", alignment: "right" },
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

const buildRangeHeader = (data: InterventionsRangePrintData, logoDataUrl: string | null) => ({
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
                        { text: data.labName, style: "brandName" },
                        { text: `${data.labAddress}\n${data.labEmail}\n${data.labPhone}`, style: "brandInfo" },
                    ],
                    margin: [0, 0, 0, 0],
                },
            ],
        },
        {
            width: "auto",
            ...buildRangeMetaBlock(data),
        },
    ],
    columnGap: 12,
    margin: [0, 0, 0, 8],
});

const buildInterventionsRangeTable = (interventions: InterventionRangeSummaryItem[]) => {
    const body: SummaryTableCell[][] = [
        [
            { text: "#", style: "summaryHeader" },
            { text: "Creato il", style: "summaryHeader" },
            { text: "Cliente", style: "summaryHeader" },
            { text: "Tipo", style: "summaryHeader" },
            { text: "Descrizione", style: "summaryHeader" },
            { text: "Data/Orario", style: "summaryHeader" },
            { text: "Stato", style: "summaryHeader" },
        ],
    ];

    if (interventions.length === 0) {
        body.push([
            { text: "Nessun intervento disponibile", colSpan: 7, alignment: "center", italics: true, margin: [0, 8, 0, 8] },
            {},
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
                { text: intervention.customerName, fontSize: 8.5 },
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
            widths: [20, 52, 76, 68, "*", 92, 56],
            body,
        },
        layout: tableLayout,
    };
};

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
    const hoursSection = buildTechnicianHoursSection(intervention);

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
            buildActivitySection(intervention),
            ...(hoursSection ? [hoursSection] : []),
            buildLegalNoticeSection(),
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
            sectionTitle: {
                fontSize: 11,
                bold: true,
                color: "#2A75B9",
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
            fineprint: {
                fontSize: 7.5,
                italics: true,
                color: "#555555",
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

export const createInterventionsRangePdfBuffer = async (data: InterventionsRangePrintData) => {
    const logoDataUrl = await loadImageDataUrl(data.labLogoUrl);

    const documentDefinition = {
        pageSize: "A4",
        pageMargins: [14, 14, 14, 14],
        defaultStyle: {
            font: "Roboto",
            fontSize: 10,
            color: "#111111",
        },
        content: [
            buildRangeHeader(data, logoDataUrl),
            buildInterventionsRangeTable(data.interventions),
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
