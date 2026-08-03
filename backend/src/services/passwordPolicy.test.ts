import { describe, expect, it } from "vitest";
import {
    generateCompliantPassword,
    generatedPasswordLength,
    isPasswordCompliant,
    passwordMinLength,
} from "./passwordPolicy";

describe("isPasswordCompliant", () => {
    it("accetta una password con lunghezza, numero e carattere speciale", () => {
        expect(isPasswordCompliant("Cantiere1!")).toBe(true);
    });

    it("accetta il minimo esatto di lunghezza", () => {
        const password = "Abcde1!x";

        expect(password).toHaveLength(passwordMinLength);
        expect(isPasswordCompliant(password)).toBe(true);
    });

    it("rifiuta una password troppo corta anche se completa", () => {
        expect(isPasswordCompliant("Ab1!xy")).toBe(false);
    });

    it("rifiuta una password senza numeri", () => {
        expect(isPasswordCompliant("Laboratorio!")).toBe(false);
    });

    it("rifiuta una password senza caratteri speciali", () => {
        expect(isPasswordCompliant("Laboratorio1")).toBe(false);
    });

    it("rifiuta la password vuota", () => {
        expect(isPasswordCompliant("")).toBe(false);
    });

    // Conseguenza voluta dell'insieme aperto: qualunque cosa non sia lettera ASCII o cifra
    // conta come speciale, lettere accentate comprese. Un elenco chiuso di simboli
    // rifiuterebbe password già valide altrove, spingendo verso quelle più prevedibili.
    it("accetta come speciale qualunque carattere non alfanumerico", () => {
        expect(isPasswordCompliant("password1 x")).toBe(true);
        expect(isPasswordCompliant("passwörd1é")).toBe(true);
    });
});

describe("generateCompliantPassword", () => {
    // Il punto: l'app non deve consegnare una credenziale che poi rifiuterebbe se digitata.
    // Cifra e simbolo sono garantiti per costruzione, ma la generazione è casuale, quindi
    // una singola estrazione non proverebbe granché.
    it("produce sempre password che superano i requisiti", () => {
        for (let attempt = 0; attempt < 500; attempt += 1) {
            const password = generateCompliantPassword();

            expect(isPasswordCompliant(password), `password non conforme: ${password}`).toBe(true);
            expect(password).toHaveLength(generatedPasswordLength);
        }
    });

    it("non mette cifra e simbolo sempre nelle stesse posizioni", () => {
        const specialPositions = new Set<number>();

        for (let attempt = 0; attempt < 200; attempt += 1) {
            const password = generateCompliantPassword();
            specialPositions.add(password.search(/[^A-Za-z0-9]/));
        }

        expect(specialPositions.size).toBeGreaterThan(1);
    });

    it("non ripete la stessa password", () => {
        const generated = new Set(Array.from({ length: 200 }, () => generateCompliantPassword()));

        expect(generated.size).toBe(200);
    });
});
