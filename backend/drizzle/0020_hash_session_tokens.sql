-- Il token di sessione era salvato in chiaro: chiunque ottenesse una copia del database
-- (un dump di backup, per esempio) poteva riusare le sessioni aperte senza conoscere
-- nessuna password. Ora in tabella finisce solo sha256(token), che non permette di
-- risalire al cookie. Le righe esistenti contengono ancora i token in chiaro e non sono
-- convertibili in hash utilizzabili, quindi vengono eliminate: tutti dovranno rifare il
-- login una volta sola, dopo l'aggiornamento.
DELETE FROM "session";
--> statement-breakpoint
ALTER TABLE "session" RENAME COLUMN "token" TO "token_hash";
