import { beforeEach, describe, expect, it } from "vitest";
import {
    isLoginRateLimited,
    loginRateLimitMaxAttempts,
    loginRateLimitMaxEntries,
    loginRateLimitSize,
    loginRateLimitWindowMs,
    registerFailedLogin,
    registerSuccessfulLogin,
    resetLoginRateLimit,
} from "./loginRateLimit";

describe("loginRateLimit", () => {
    beforeEach(() => {
        resetLoginRateLimit();
    });

    it("blocca l'IP solo dopo aver esaurito i tentativi previsti", () => {
        for (let attempt = 0; attempt < loginRateLimitMaxAttempts - 1; attempt += 1) {
            registerFailedLogin("1.2.3.4");
            expect(isLoginRateLimited("1.2.3.4")).toBe(false);
        }

        registerFailedLogin("1.2.3.4");
        expect(isLoginRateLimited("1.2.3.4")).toBe(true);
    });

    it("non estende il blocco agli altri IP", () => {
        for (let attempt = 0; attempt < loginRateLimitMaxAttempts; attempt += 1) {
            registerFailedLogin("1.2.3.4");
        }

        expect(isLoginRateLimited("5.6.7.8")).toBe(false);
    });

    it("sblocca l'IP una volta scaduta la finestra", () => {
        const now = Date.now();

        for (let attempt = 0; attempt < loginRateLimitMaxAttempts; attempt += 1) {
            registerFailedLogin("1.2.3.4", now);
        }

        expect(isLoginRateLimited("1.2.3.4", now)).toBe(true);
        expect(isLoginRateLimited("1.2.3.4", now + loginRateLimitWindowMs + 1)).toBe(false);
    });

    it("azzera il conteggio dopo un login riuscito", () => {
        for (let attempt = 0; attempt < loginRateLimitMaxAttempts; attempt += 1) {
            registerFailedLogin("1.2.3.4");
        }

        registerSuccessfulLogin("1.2.3.4");
        expect(isLoginRateLimited("1.2.3.4")).toBe(false);
    });

    // Il caso che conta una volta esposti su internet: senza tetto, ogni IP sorgente
    // diverso lascia una entry in memoria e la mappa cresce finché il processo regge.
    it("tiene limitata la memoria anche con IP sorgente sempre diversi", () => {
        for (let index = 0; index < loginRateLimitMaxEntries + 500; index += 1) {
            registerFailedLogin(`10.0.${Math.floor(index / 256)}.${index % 256}`);
        }

        expect(loginRateLimitSize()).toBeLessThanOrEqual(loginRateLimitMaxEntries);
    });

    it("scartando le entry non perde il blocco appena registrato", () => {
        for (let index = 0; index < loginRateLimitMaxEntries + 500; index += 1) {
            registerFailedLogin(`10.0.${Math.floor(index / 256)}.${index % 256}`);
        }

        const recentIp = "203.0.113.7";
        for (let attempt = 0; attempt < loginRateLimitMaxAttempts; attempt += 1) {
            registerFailedLogin(recentIp);
        }

        expect(isLoginRateLimited(recentIp)).toBe(true);
    });
});
