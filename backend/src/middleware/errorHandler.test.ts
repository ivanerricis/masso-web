import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { errorHandler } from "./errorHandler";

const createResponse = () => {
    const res = {
        locals: {} as Record<string, unknown>,
        statusCode: 0,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(payload: unknown) {
            this.body = payload;
            return this;
        },
    };

    return res as unknown as Response & { statusCode: number; body: { message: string } };
};

const run = (error: unknown) => {
    const res = createResponse();
    errorHandler(error, {} as Request, res, (() => {}) as NextFunction);
    return res;
};

describe("errorHandler", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("mappa la violazione di unicità (23505) su 409", () => {
        const res = run({ code: "23505", detail: "Key (username)=(mario) already exists." });

        expect(res.statusCode).toBe(409);
        expect(res.body.message).toBe("Key (username)=(mario) already exists.");
    });

    it("traduce una FK violata in cancellazione nel messaggio sul genitore", () => {
        const res = run({
            code: "23503",
            constraint: "report_device_id_device_id_fk",
            message: 'update or delete on table "device" violates foreign key constraint',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Impossibile eliminare il dispositivo: è ancora associato a uno o più rapporti.");
    });

    it("traduce una FK violata in inserimento nel messaggio sul riferimento", () => {
        const res = run({
            code: "23503",
            constraint: "report_device_id_device_id_fk",
            message: 'insert or update on table "report" violates foreign key constraint',
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Il dispositivo selezionato non esiste.");
    });

    it("trova l'errore Postgres anche annidato dentro `cause`", () => {
        const res = run(new Error("wrapper", { cause: { code: "23502", detail: "Colonna mancante" } }));

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Colonna mancante");
    });

    it("non espone il dettaglio Postgres al client sugli errori non gestiti", () => {
        const res = run({ message: 'relation "report" does not exist', detail: "interno" });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe("Si è verificato un errore imprevisto. Riprova più tardi.");
        expect(res.body.message).not.toContain("report");
        // Il dettaglio deve comunque restare disponibile per il log azioni utente.
        expect(res.locals.apiErrorMessage).toBe("interno");
    });
});
