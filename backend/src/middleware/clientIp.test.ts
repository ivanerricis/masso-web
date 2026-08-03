import type { Request } from "express";
import { describe, expect, it } from "vitest";
import { getClientIp } from "./clientIp";

const makeRequest = (headers: Record<string, string>, ip?: string): Request =>
    ({
        get: (name: string) => headers[name.toLowerCase()],
        ip,
    }) as unknown as Request;

describe("getClientIp", () => {
    it("usa CF-Connecting-IP quando presente", () => {
        expect(getClientIp(makeRequest({ "cf-connecting-ip": "203.0.113.7" }, "172.18.0.5"))).toBe("203.0.113.7");
    });

    // Il punto della funzione: X-Forwarded-For è scrivibile dal chiamante, quindi non deve
    // poter spostare il conteggio del rate limiter su un IP a scelta dell'attaccante.
    // Express popola req.ip da quell'header, perciò CF-Connecting-IP deve vincere.
    it("ignora l'IP dedotto da X-Forwarded-For se Cloudflare ha indicato il client reale", () => {
        const req = makeRequest({ "cf-connecting-ip": "203.0.113.7" }, "198.51.100.1");

        expect(getClientIp(req)).toBe("203.0.113.7");
    });

    it("ricade su req.ip fuori da Cloudflare (sviluppo in locale)", () => {
        expect(getClientIp(makeRequest({}, "127.0.0.1"))).toBe("127.0.0.1");
    });

    it("non tratta un header vuoto come un IP valido", () => {
        expect(getClientIp(makeRequest({ "cf-connecting-ip": "   " }, "127.0.0.1"))).toBe("127.0.0.1");
    });

    it("resta con un valore utilizzabile quando l'IP non è determinabile", () => {
        expect(getClientIp(makeRequest({}))).toBe("unknown");
    });
});
