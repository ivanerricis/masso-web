/**
 * Limitatore dei tentativi di login, per IP di provenienza.
 *
 * Estratto da authManager perché non tocca il database: così è testabile senza una
 * connessione attiva, e la logica di scadenza/pulizia sta in un posto solo.
 */

export const loginRateLimitWindowMs = 15 * 60 * 1000;
export const loginRateLimitMaxAttempts = 5;
// Una volta esposta su internet la mappa dei tentativi diventa memoria che un estraneo
// può far crescere a piacere: ogni IP sorgente diverso crea una entry, e prima le entry
// venivano rimosse solo al login riuscito. Con un tetto massimo la memoria resta limitata
// anche sotto scansione continua da indirizzi che ruotano.
export const loginRateLimitMaxEntries = 10_000;

type Attempt = { count: number; resetAt: number };

const attemptsByIp = new Map<string, Attempt>();

/**
 * Scarta le entry scadute e, se ancora non bastasse, quelle che scadono per prime.
 * Sacrificare le più vicine alla scadenza è preferibile a sacrificare quelle appena
 * create: sono le meno informative rimaste.
 */
const prune = (now: number): void => {
    for (const [ip, entry] of attemptsByIp) {
        if (entry.resetAt <= now) {
            attemptsByIp.delete(ip);
        }
    }

    if (attemptsByIp.size < loginRateLimitMaxEntries) {
        return;
    }

    const excess = attemptsByIp.size - loginRateLimitMaxEntries + 1;
    const oldestFirst = [...attemptsByIp.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);

    for (const [ip] of oldestFirst.slice(0, excess)) {
        attemptsByIp.delete(ip);
    }
};

/** true se l'IP ha esaurito i tentativi nella finestra corrente. */
export const isLoginRateLimited = (ip: string, now = Date.now()): boolean => {
    const entry = attemptsByIp.get(ip);

    return Boolean(entry && entry.resetAt > now && entry.count >= loginRateLimitMaxAttempts);
};

export const registerFailedLogin = (ip: string, now = Date.now()): void => {
    const entry = attemptsByIp.get(ip);

    if (!entry || entry.resetAt <= now) {
        if (attemptsByIp.size >= loginRateLimitMaxEntries) {
            prune(now);
        }

        attemptsByIp.set(ip, { count: 1, resetAt: now + loginRateLimitWindowMs });
        return;
    }

    entry.count += 1;
};

export const registerSuccessfulLogin = (ip: string): void => {
    attemptsByIp.delete(ip);
};

/** Solo per i test: riporta il limitatore allo stato iniziale. */
export const resetLoginRateLimit = (): void => {
    attemptsByIp.clear();
};

/** Solo per i test: numero di IP attualmente tracciati. */
export const loginRateLimitSize = (): number => attemptsByIp.size;
