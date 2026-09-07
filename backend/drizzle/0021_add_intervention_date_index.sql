-- Il calendario chiedeva tutti gli interventi e ne riceveva al massimo 5000 (il tetto di
-- `takeUnpaginated`): oltre quella soglia gli altri sparivano senza alcun errore. Ora
-- chiede solo l'intervallo di date visibile, e questo indice è ciò che rende quel filtro
-- una lettura d'indice invece di una scansione dell'intera tabella.
CREATE INDEX IF NOT EXISTS "intervention_intervention_date_idx" ON "intervention" ("intervention_date");
