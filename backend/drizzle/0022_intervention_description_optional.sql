-- Un intervento in stato "programmato" descrive un lavoro non ancora svolto: l'assistenza
-- effettuata (o i materiali consegnati) è un'informazione che nasce quando il lavoro viene
-- fatto, non quando viene messo in agenda. Finora la colonna era NOT NULL e costringeva a
-- inventare un testo al momento della programmazione.
--
-- Diventa quindi facoltativa, con lo stesso significato che ha già `problem`: NULL = non
-- ancora noto. Resta obbligatoria negli stati "in lavorazione" e "completato", ma quella è
-- una regola applicativa (routes/interventions.ts), non un vincolo della colonna: al momento
-- del passaggio di stato il testo può arrivare nella stessa richiesta.
ALTER TABLE "intervention" ALTER COLUMN "description" DROP NOT NULL;
