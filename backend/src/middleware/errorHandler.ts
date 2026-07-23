import express from "express";

type PgError = {
    code?: string;
    detail?: string;
    message?: string;
    table?: string;
    constraint?: string;
};

const findPgError = (error: unknown): PgError => {
    const visited = new Set<object>();
    let current: unknown = error;

    while (current && typeof current === "object") {
        if (visited.has(current)) {
            break;
        }

        visited.add(current);

        const candidate = current as PgError & { cause?: unknown };

        if (candidate.code || candidate.detail) {
            return {
                code: candidate.code,
                detail: candidate.detail,
                message: candidate.message,
                table: candidate.table,
                constraint: candidate.constraint,
            };
        }

        current = (candidate as { cause?: unknown }).cause;
    }

    const fallback = error as { message?: string };
    return { message: fallback?.message };
};

// Foreign key constraint names follow drizzle-kit's default convention:
// <childTable>_<column>_<parentTable>_<parentColumn>_fk
// Kept as an explicit map (rather than parsed from the name) so wording stays
// natural in Italian and independent of Postgres' own error text/locale.
const FK_MESSAGES: Record<string, { parentTable: string; onDeleteParent: string; onInvalidReference: string }> = {
    report_device_id_device_id_fk: {
        parentTable: "device",
        onDeleteParent: "Impossibile eliminare il dispositivo: è ancora associato a uno o più rapporti.",
        onInvalidReference: "Il dispositivo selezionato non esiste.",
    },
    report_issue_id_issue_id_fk: {
        parentTable: "issue",
        onDeleteParent: "Impossibile eliminare il guasto: è ancora associato a uno o più rapporti.",
        onInvalidReference: "Il guasto selezionato non esiste.",
    },
    report_collaborator_id_collaborator_id_fk: {
        parentTable: "collaborator",
        onDeleteParent: "Impossibile eliminare il collaboratore: è ancora associato a uno o più rapporti.",
        onInvalidReference: "Il collaboratore selezionato non esiste.",
    },
    report_customer_id_customer_id_fk: {
        parentTable: "customer",
        onDeleteParent: "Impossibile eliminare il cliente: è ancora associato a uno o più rapporti.",
        onInvalidReference: "Il cliente selezionato non esiste.",
    },
    report_technician_report_id_report_id_fk: {
        parentTable: "report",
        onDeleteParent: "Impossibile eliminare il rapporto: è ancora assegnato a uno o più tecnici.",
        onInvalidReference: "Il rapporto selezionato non esiste.",
    },
    report_technician_technician_id_technician_id_fk: {
        parentTable: "technician",
        onDeleteParent: "Impossibile eliminare il tecnico: è ancora assegnato a uno o più rapporti.",
        onInvalidReference: "Il tecnico selezionato non esiste.",
    },
};

const foreignKeyViolationMessage = ({ constraint, table, detail }: PgError): string => {
    const known = constraint ? FK_MESSAGES[constraint] : undefined;

    if (!known) {
        return detail ?? "Riferimento non valido";
    }

    return table === known.parentTable ? known.onDeleteParent : known.onInvalidReference;
};

export const errorHandler = (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
) => {
    const pgError = findPgError(error);
    const { code, detail, message } = pgError;

    if (code === "23505") {
        const apiErrorMessage = detail ?? "Valore duplicato";
        res.locals.apiErrorMessage = apiErrorMessage;
        res.status(409).json({ message: apiErrorMessage });
        return;
    }

    if (code === "23503") {
        const apiErrorMessage = foreignKeyViolationMessage(pgError);
        res.locals.apiErrorMessage = apiErrorMessage;
        res.status(400).json({ message: apiErrorMessage });
        return;
    }

    if (code === "23502") {
        const apiErrorMessage = detail ?? "Campo obbligatorio mancante";
        res.locals.apiErrorMessage = apiErrorMessage;
        res.status(400).json({ message: apiErrorMessage });
        return;
    }

    console.error(error);
    const apiErrorMessage = detail ?? message ?? "Internal server error";
    res.locals.apiErrorMessage = apiErrorMessage;
    res.status(500).json({ message: apiErrorMessage });
};
