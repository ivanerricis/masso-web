# Changelog

Registro dei miglioramenti tecnici di easylab-web: cosa è cambiato, **perché**, e quali file
sono coinvolti. Le voci più recenti stanno in cima.

Il README resta la guida operativa (installazione, backup, aggiornamento); qui si annota
solo l'evoluzione del codice e dell'infrastruttura.

> **Convenzione:** una voce per intervento, con la motivazione. Il "perché" è la parte che
> non si ricostruisce dal diff — è il motivo per cui questo file esiste.

---

## 2026-08-07 — La retention dei backup ora si applica anche alla copia sul NAS

`pruneOldBackups` cancellava i dump più vecchi del limite configurato (`maxBackupsToKeep`,
default 14) solo nella cartella locale (`backups/`). La copia caricata via SMB sul NAS
non veniva mai ripulita: `uploadDumpToSmb` esegue solo `put`, quindi ogni esecuzione
automatica aggiungeva un file senza mai rimuoverne — accumulo indefinito sul NAS anche
con la retention locale attiva.

- **`backupSmb.ts`**: `runSmbClient` ora restituisce lo stdout (prima solo `resolve()`),
  necessario per leggere l'output di `ls`. Nuove funzioni: `listSmbBackupFileNames`
  (estrae i nomi dei dump dall'output di `ls` via `backupFileNameScanPattern`, non uno
  split per spazi — i nomi di backup non contengono spazi ma il resto della cartella non
  è garantito), `deleteSmbFile` (`del` via smbclient), `computeSmbFilesToDelete` (stessa
  logica di ordinamento cronologico di `sortBackupFileNamesByAge`, isolata e testabile
  senza I/O) e `pruneOldSmbBackups` che le combina, cancellando in sequenza — al più un
  file da eliminare per esecuzione, quindi il costo resta trascurabile.
- **`backupManager.ts`**: `runBackupNow` chiama `pruneOldSmbBackups` subito dopo un
  upload riuscito, con lo stesso `maxBackupsToKeep` della retention locale. Un fallimento
  della pulizia non retrocede `smbLastStatus` a `failed` (il backup sul NAS c'è ed è
  intatto) ma genera una notifica dedicata (`backup:auto-nas-prune-failed`) e viene
  aggiunto al messaggio restituito, sullo stesso modello del fallimento di upload.
- File: `backend/src/services/backupFiles.ts` (nuovo `backupFileNameScanPattern`),
  `backend/src/services/backupSmb.ts`, `backend/src/services/backupManager.ts`,
  `backend/src/services/backupManager.test.ts`.

---

## 2026-08-07 — Il logo caricato viene normalizzato in PNG invece di essere servito grezzo

Il logo dell'azienda (sidebar, impostazioni, header dei PDF) viene caricato dall'utente
e salvato su disco così com'è, senza alcuna elaborazione — nessuna libreria di image
processing era presente nel backend. Un logo caricato come JPEG lossy con forme piatte
e bordi netti (tipico di un'icona) produce artefatti a blocchi 8×8 dovuti alla
compressione, invisibili a piena risoluzione ma evidenti quando l'immagine viene
rimpicciolita nel box di 32px della sidebar (`object-cover`, nessun hint di
`image-rendering`): il logo appare pixellato.

- **`saveLogo` ora passa i file raster per `sharp`**, li ridimensiona dentro un
  riquadro massimo di 512×512 (`fit: "inside", withoutEnlargement: true` — mai
  ingrandire un'immagine piccola, che peggiorerebbe la nitidezza) e li ri-codifica come
  PNG, formato lossless che non introduce blocking artifacts. Gli SVG restano intoccati:
  sono già vettoriali, passarli per sharp li rasterizzerebbe inutilmente.
- Il logo già presente su disco (JPEG 232×242, caricato il 2026-07-30) è stato
  riprocessato una tantum con la stessa pipeline, così l'effetto è visibile subito senza
  richiedere un nuovo upload dall'utente.
- File: `backend/src/services/logoManager.ts`; nuova dipendenza `sharp` in
  `backend/package.json`.

---

## 2026-08-05 — Barre dei filtri: estratti il menu a tendina e l'intervallo di date

Seguito della pulizia qui sotto, che aveva lasciato intatti i tre file dei filtri di
clienti, rapporti e interventi perché — a differenza degli altri quattro — non erano
semplici inoltri a `SearchInput`. Contengono però tre duplicazioni misurate.

- **Il blocco dell'intervallo di date era in due copie identiche carattere per carattere**
  (31 righe l'una) fra rapporti e interventi, insieme al proprio `handleClearDates` e al
  pulsante "Pulisci date". Non è impaginazione: dentro c'è il vincolo `max={dateTo}` /
  `min={dateFrom}` incrociato fra i due campi, che impedisce di scegliere un inizio
  successivo alla fine. Una regola di comportamento in due copie sono due occasioni perché
  una cambi da sola, e nessuno confronta due file di pagine diverse.

- **Il menu a tendina con l'icona in modalità compatta era in sei copie** (una nei clienti,
  due nei rapporti, tre negli interventi), tutte con lo stesso `SelectTrigger` da 12 righe.
  Gli elenchi di opzioni erano già tutti nella forma `{ value, label }[]`, quindi un
  `FilterSelect<T extends string>` li copre senza forzature. La voce "tutti gli stati" è una
  prop opzionale, perché nei rapporti era scritta a mano e negli interventi mappata: erano
  già due modi diversi di fare la stessa cosa.

- **`COMPACT_BREAKPOINT = 640` era dichiarato tre volte.** Cambiarne una copia sola avrebbe
  fatto passare in modalità compatta le barre di elenchi diversi a larghezze diverse — una
  differenza che si nota solo ridimensionando la finestra, cioè quasi mai. Ora vive accanto
  al componente che lo usa.

I tre file restano separati: i clienti hanno un solo menu, gli interventi tre più le date, e
la configurazione capace di coprirli tutti sarebbe più difficile da leggere dei tre file.
Per lo stesso motivo le prop non sono state compattate in un unico oggetto di stato: dodici
prop sono verbose, ma dalla firma si vede quali filtri esistono.

*Verifica:* Docker non era in esecuzione, quindi invece del giro con Playwright usato per le
tabelle sono stati scritti dieci test sui due componenti — più adatti allo scopo, perché
coprono proprio ciò che uno screenshot non mostra: il vincolo min/max che si aggiorna quando
cambia una delle due date, il fatto che "Pulisci date" azzeri **entrambi** i campi e non solo
quello impostato, la presenza o assenza della voce "tutti", e il trigger che sotto i 640px
perde il testo **mantenendo il nome accessibile**.

Ha richiesto due stub in `src/test/setup.ts`: jsdom non implementa la Pointer Events API né
`scrollIntoView`, che i componenti Radix usano, e senza di essi un semplice click su un menu
falliva con `target.hasPointerCapture is not a function` — un errore che non c'entra con ciò
che il test verifica. Servono a qualunque futuro test su Select, DropdownMenu o Popover.
→ [frontend/src/components/filters/](../frontend/src/components/filters/)

---

## 2026-08-05 — Pulizia del codice morto e delle duplicazioni

Revisione sistematica di manutenibilità su tutto il repository. Sei interventi distinti,
raccolti qui perché nascono dalla stessa lettura.

### Codice morto rimosso

- **Nove file non raggiungibili da nessuna parte del programma.** `errorDialog.tsx` era
  vuoto (0 byte); `combobox.tsx` erano 299 righe di componente shadcn che nessuno importa;
  `tableLoadingSkeleton.tsx` era stato sostituito da `LoadingPage` senza essere cancellato;
  `assets/react.svg` è un residuo dello scaffold di Vite; `lib/api.ts` conteneva solo
  `export * from "./api/index"`, un rimbalzo che la risoluzione per directory rende inutile.
  → [frontend/src/](../frontend/src/)

- **`db/relations.ts` (75 righe) descriveva relazioni che Drizzle non ha mai letto.** Le
  `relations()` servono solo all'API relazionale (`db.query.*`), che richiede di passare lo
  schema a `drizzle()`. In [db/index.ts](../backend/src/db/index.ts) la chiamata è
  `drizzle(pool)`, senza schema, e nel backend non esiste una sola `db.query`: tutte le
  query sono `db.select()` con join espliciti. Il file dichiarava quindi una mappa del
  dominio che nessuno consultava — peggio che inutile, perché a leggerla si crede che
  cambiarla abbia un effetto.
  → `backend/src/db/relations.ts`, `backend/src/routes/utils.ts`

- **Le pagine di dettaglio di dispositivi e difetti erano segnaposto irraggiungibili.**
  `DevicePage` e `IssuePage` mostravano "Pagina dettaglio in preparazione" su rotte
  (`/devices/:id`, `/issues/:id`) che nessun link dell'app apre: le rispettive tabelle
  hanno solo modifica ed eliminazione, e la sidebar punta agli elenchi. Restavano
  raggiungibili solo digitando l'URL a mano, dove mostravano un cantiere aperto dentro un
  prodotto finito. Difetti e dispositivi sono tabelle a due campi (nome, descrizione): una
  scheda di dettaglio non avrebbe niente da mostrare.
  → [frontend/src/App.tsx](../frontend/src/App.tsx)

- **La POST dei rapporti validava due volte la stessa regola.** Il vincolo "se il pagamento
  è in contanti o con carta il prezzo deve essere > 0" era espresso sia in un `.refine()`
  di `reportCreateBodySchema` sia in un `if` dentro l'handler. Il secondo era irraggiungibile
  — `validate()` rifiuta prima che l'handler parta — ma conteneva una seconda copia del
  messaggio d'errore, pronta a divergere dalla prima. Il controllo nella PUT resta: lì il
  metodo di pagamento e il prezzo possono arrivare uno dal corpo parziale e l'altro dalla
  riga esistente, combinazione che lo schema non può vedere.
  → [backend/src/routes/reports.ts](../backend/src/routes/reports.ts)

### Il toaster non seguiva il tema scelto nell'app

- **`ui/sonner.tsx` leggeva il tema da `next-themes`, che in questo progetto non ha nessun
  provider.** È il file come lo genera shadcn, mai adattato: l'app usa il proprio
  `ThemeProvider`, quindi `useTheme()` di `next-themes` restituiva un oggetto vuoto e il
  toaster ripiegava sul default `"system"`. Conseguenza visibile: chi sceglieva Chiaro con
  il sistema operativo in scuro riceveva notifiche scure. Ora legge da
  `@/components/use-theme`, e la dipendenza `next-themes` è stata rimossa insieme a
  `@base-ui/react` (usata solo dal combobox morto) e a `@vitest/coverage-v8` (dichiarata
  senza nessuno script o passo di CI che raccolga la copertura).
  → [frontend/src/components/ui/sonner.tsx](../frontend/src/components/ui/sonner.tsx)

### Una sola classe d'errore applicativo al posto di otto

- **Sette servizi avevano ognuno la propria classe d'errore, identica alle altre carattere
  per carattere**, e otto rotte avevano ognuna la propria copia del codice che la traduce in
  risposta HTTP (`instanceof`, `res.locals.apiErrorMessage`, `res.status().json()`). Solo
  `settings.ts` ne conteneva sei, invocate da 22 blocchi `try/catch` tutti uguali. Il costo
  non era la lunghezza ma la soglia: aggiungere l'ottavo servizio significava scrivere
  l'ottava classe e la nona copia del traduttore, e nessuno se ne sarebbe accorto.

  Ora esiste `ApiError` (messaggio già destinato al client + `statusCode`), le classi dei
  servizi la estendono, e la traduzione avviene una volta sola in
  [errorHandler.ts](../backend/src/middleware/errorHandler.ts). Le rotte non hanno più
  `try/catch`: Express 5 inoltra da sé il rifiuto di un handler `async` al middleware
  d'errore, cosa su cui `crudRouter` faceva già affidamento.

  Due dettagli emersi copia per copia, che è esattamente il motivo per cui la duplicazione
  costa: le classi di `logManager` e `logoManager` avevano `statusCode = 400` di default
  invece di 500, ma **nessuna delle 40 istanziazioni omette lo status**, quindi quei default
  divergenti non sono mai stati in gioco; e la copia in `interventions.ts` dimenticava
  `res.locals.apiErrorMessage`, per cui un invio email fallito finiva nel registro delle
  azioni utente come `error=HTTP 502`, senza il motivo. Entrambi risolti dal fatto che ora
  la logica è una sola.
  → [backend/src/services/apiError.ts](../backend/src/services/apiError.ts),
  [backend/src/routes/settings.ts](../backend/src/routes/settings.ts)

### La configurazione Prettier del frontend descriveva uno stile che il codice non usava

- **164 file su ~180 non passavano `prettier --check`.** Il frontend aveva un `.prettierrc`
  (2 spazi, niente punto e virgola, 80 colonne) e uno script `format`, ma nessun
  `format:check` e nessun passo di CI che lo verificasse: la configurazione era decorativa.
  Il codice scritto a mano nel frattempo si era assestato su 4 spazi e punto e virgola —
  123 file su 174 — cioè esattamente la configurazione del backend.

  Allineare il file di configurazione al codice, invece del contrario, è la scelta che
  riformatta di meno e che rende i due pacchetti coerenti fra loro. Il vero problema non era
  estetico: senza un controllo automatico, ogni file toccato in futuro sarebbe stato
  riformattato dall'editor di turno, seppellendo la modifica vera dentro un diff che tocca
  tutto il file. La riformattazione è in un commit separato che non cambia altro, così
  `git blame` resta leggibile.
  → [frontend/.prettierrc](../frontend/.prettierrc),
  [.github/workflows/ci.yml](../.github/workflows/ci.yml)

### Duplicazioni consolidate

- **I due generatori di PDF condividevano ~130 righe identiche.** `reportPdf.ts` e
  `interventionPdf.ts` avevano ognuno la propria copia di registrazione dei font,
  `loadImageDataUrl`, layout di tabella, `sectionBarRow`/`dualFieldRow` e dell'intero
  frontespizio dei riepiloghi per cliente; i token grafici (il blu `#2A75B9`, i corpi
  carattere) comparivano in **quattro** blocchi `styles` separati. È la duplicazione più
  cara fra quelle trovate: cambiare un colore del marchio richiedeva quattro modifiche
  coordinate, e dimenticarne una non rompe la compilazione — produce un PDF sbagliato in
  mano al cliente. Inoltre `pdfmake.addFonts()` veniva eseguita due volte all'avvio.

  *Verifica:* i quattro documenti (rapporto singolo, riepilogo rapporti per cliente,
  intervento singolo, riepilogo interventi per cliente) sono stati rigenerati con lo stesso
  input prima e dopo, e confrontati byte a byte: differiscono solo per `/CreationDate` e
  `/ID`, cioè il timestamp di generazione.
  → [backend/src/services/pdf/shared.ts](../backend/src/services/pdf/shared.ts)

- **Sette tabelle identiche a meno del nome del DTO.** Ogni entità aveva il proprio
  `*-table.tsx` che ripeteva per intero la struttura "tabella su desktop, schede su mobile":
  `diff` fra `devices-table` e `issues-table` restituiva solo rinomine — più un
  `overflow-y-auto` rimasto sul `TableBody` dei difetti e su nessun altro. È il modo tipico
  in cui questa duplicazione fa danno: una differenza involontaria che non rompe niente e
  che non nota nessuno. Ora la struttura sta in `EntityTable`; i pulsanti di riga restano
  invece nei file delle entità, perché sono davvero diversi (i clienti ne hanno sei, i
  dispositivi due) e ridurli a configurazione costerebbe più di quanto farebbe risparmiare.

  Stessa logica per gli hook di lista: quattro `use*Rows` identici a meno del nome della
  funzione API sono diventati `useSearchableRows`, mentre quelli di rapporti e interventi
  restano separati perché usano anche `updateRow`. E quattro `*-filters.tsx` che si
  limitavano a inoltrare a `SearchInput` cambiando il testo del segnaposto sono stati
  eliminati: le pagine chiamano `SearchInput` direttamente. Quelli di clienti, rapporti e
  interventi restano, perché contengono anche i menu di ordinamento e di stato.

  *Verifica:* tutte e sette le liste sono state aperte con Playwright, a 1440px e a 390px,
  confrontando numero di colonne, di righe e di pulsanti per riga, i colori di stato di
  rapporti e interventi e il bordo colorato delle schede su mobile. Nessun errore in console.
  → [frontend/src/components/entity-table.tsx](../frontend/src/components/entity-table.tsx),
  [frontend/src/hooks/useSearchableRows.ts](../frontend/src/hooks/useSearchableRows.ts)

- **Rapporti e interventi ridichiaravano lo schema di lista invece di estenderlo.**
  `page`, `pageSize`, `search`, `sortOrder` e lo schema del parametro `:id` erano riscritti
  identici a quelli già esportati da `crudRouter.ts`. Ora li estendono, aggiungendo solo i
  filtri propri e restringendo `sortBy` alle colonne che sanno davvero ordinare: i limiti
  comuni a tutte le liste (per esempio `pageSize` massimo 1000) tornano a essere decisi in
  un posto solo.
  → [backend/src/routes/reports.ts](../backend/src/routes/reports.ts),
  [backend/src/routes/interventions.ts](../backend/src/routes/interventions.ts)

### Non fatto di proposito

- **La sidebar shadcn resta com'è**, con 15 dei suoi 25 export inutilizzati (~250 righe).
  È codice di terze parti copiato nel repository: potarlo lo farebbe divergere da monte, e
  un futuro `shadcn add sidebar` entrerebbe in conflitto con le modifiche. Codice inutilizzato
  dentro un file di libreria costa molto meno di codice inutilizzato scritto da noi, e a
  runtime non costa niente perché Vite lo elimina dal bundle. Diverso il caso di
  `combobox.tsx`, cancellato sopra: era inutilizzato **per intero**, e ricrearlo è un comando.
  → [frontend/src/components/ui/sidebar.tsx](../frontend/src/components/ui/sidebar.tsx)

---

## 2026-08-03 — Versione di nginx fissata nell'immagine del frontend

- **`FROM nginx:alpine` non indicava alcuna versione.** Un tag Docker non è una versione, è
  un'etichetta che l'autore a monte può spostare: quel testo oggi risolve a nginx 1.31.3, fra
  un anno a qualcos'altro, e nel repository non restava traccia di cosa fosse stato
  effettivamente collaudato. Una ricostruzione da zero — VM nuova, o immagini rimosse —
  poteva quindi portare un nginx maggiore diverso da quello su cui sono stati verificati gli
  header di sicurezza e le regole di cache. Ora `nginx:1.31-alpine`, la stessa versione già
  in uso: dentro quella riga le patch continuano ad arrivare, cambiare riga diventa una
  decisione invece di un effetto collaterale.
  → [frontend/Dockerfile](../frontend/Dockerfile)

- **Le altre immagini restano come sono, per motivi diversi fra loro.** `postgres:16` e
  `node:24-*` hanno già fissato il numero maggiore, che è la cosa che conta (un salto a
  Postgres 17 con formato dati incompatibile è il caso peggiore, ed è escluso).
  `cloudflare/cloudflared:latest` fluttua di proposito: Cloudflare deprecia le versioni
  vecchie del tunnel e può rifiutare i client obsoleti, quindi bloccarlo creerebbe un guasto
  ad orologeria invece di prevenirne uno.
  *Non fatto di proposito:* l'ancoraggio al digest (`@sha256:...`), l'unica difesa reale
  contro un'immagine malevola pubblicata sotto lo stesso tag. Interrompe però l'arrivo
  automatico delle patch e va mantenuto a mano: su un progetto con un solo manutentore, un
  Postgres ancorato e dimenticato per due anni è messo peggio di uno che fluttua dentro `16`.
  → [docker-compose.yml](../docker-compose.yml)

---

## 2026-08-03 — Requisiti minimi delle password

- **Il requisito era solo `min(8)`**, senza controlli di complessità. Andava bene finché si
  entrava dalla LAN; con l'app pubblicata su un dominio quel campo è la porta d'ingresso da
  internet. Il limitatore dei tentativi (5 ogni 15 minuti) rende lento un attacco a forza
  bruta, ma le prime cinque prove sono proprio quelle che indovinano `password1`. Ora servono
  8 caratteri **con almeno un numero e un carattere speciale**.
  L'insieme dei simboli accettati è volutamente aperto — vale tutto ciò che non è lettera o
  cifra, lettere accentate comprese — perché un elenco chiuso rifiuterebbe password già in
  uso altrove, spingendo verso quelle più prevedibili.
  → [backend/src/services/passwordPolicy.ts](../backend/src/services/passwordPolicy.ts),
  [backend/src/routes/auth.ts](../backend/src/routes/auth.ts)

- **Le password generate dall'app non avrebbero superato i nuovi requisiti:** l'alfabeto di
  generazione conteneva solo lettere e cifre, quindi l'app avrebbe consegnato credenziali
  che avrebbe rifiutato se digitate. Generazione e validazione ora stanno nello stesso
  modulo, che non tocca il database ed è quindi verificabile senza una connessione attiva.
  Cifra e simbolo sono garantiti per costruzione e poi mescolati (Fisher-Yates): lasciarli
  in posizione fissa ridurrebbe a due i caratteri da indovinare. Colta l'occasione per
  togliere la distorsione del modulo su un byte, che favoriva i primi caratteri
  dell'alfabeto.
  → [backend/src/services/passwordPolicy.ts](../backend/src/services/passwordPolicy.ts),
  [backend/src/services/authManager.ts](../backend/src/services/authManager.ts)

- **`reset-admin-password.js` aveva una terza copia della generazione**, con l'alfabeto
  vecchio: uno script di emergenza che consegna una password non conforme è il momento
  peggiore per accorgersene. Ora richiede il modulo compilato invece di duplicare la regola.
  → [backend/reset-admin-password.js](../backend/reset-admin-password.js)

- **Il frontend controllava `length < 8` in due punti separati**, con il messaggio scritto a
  mano in entrambi. Regola e testo ora stanno in un solo file, mostrato anche sotto il campo
  come promemoria: l'utente sa cosa serve prima di inviare, invece di scoprirlo dal
  messaggio di errore. La duplicazione rispetto al backend resta voluta e annotata — il
  controllo che vale è quello del server.
  → [frontend/src/lib/passwordPolicy.ts](../frontend/src/lib/passwordPolicy.ts),
  [frontend/src/pages/auth/ForcePasswordChangePage.tsx](../frontend/src/pages/auth/ForcePasswordChangePage.tsx),
  [frontend/src/components/dialogs/settings/changePasswordDialog.tsx](../frontend/src/components/dialogs/settings/changePasswordDialog.tsx)

> Le password già in uso non vengono invalidate: chi ne ha una non conforme continua a
> entrare finché non la cambia. I nuovi requisiti valgono dal prossimo cambio password.

---

## 2026-08-03 — Esposizione su dominio pubblico via Cloudflare Tunnel

Fine della modalità "solo LAN": l'app viene pubblicata su un dominio, e le scorciatoie
prese quando la rete era considerata fidata vanno tolte tutte insieme — a metà sarebbero
peggio che non fatte.

- **Il limitatore dei tentativi di login era aggirabile in modo banale.** `app.set("trust
  proxy", true)` dice a Express di credere a qualunque `X-Forwarded-For` in arrivo, e da
  quell'header Express ricava `req.ip`, che era la chiave del limitatore: bastava mandare
  un valore diverso a ogni tentativo per avere login illimitati. In LAN era un difetto
  teorico, su internet avrebbe reso il limitatore puramente decorativo. Ora ci si fida di
  un solo hop (nginx del frontend, l'unico che può raggiungere il backend) e l'IP reale si
  legge da `CF-Connecting-IP`, che Cloudflare **sovrascrive** scartando quanto inviato dal
  chiamante. È affidabile solo perché non esiste un percorso alternativo per raggiungere
  l'origine: nessuna porta pubblicata, nessun port forward.
  → [backend/src/middleware/clientIp.ts](../backend/src/middleware/clientIp.ts),
  [backend/src/index.ts](../backend/src/index.ts)

- **La mappa dei tentativi era memoria che un estraneo poteva far crescere.** Ogni IP
  sorgente creava una entry, e le entry venivano rimosse solo al login riuscito: mai per
  scadenza. Con IP che ruotano — la norma su internet, l'eccezione in LAN — cresceva senza
  limite. Il limitatore è stato estratto in un modulo proprio (senza dipendenze dal
  database, quindi testabile davvero), con scadenza effettiva, tetto massimo di entry e
  soglia portata da 10 a 5 tentativi per finestra.
  *Volutamente non fatto:* la persistenza tra riavvii. Il conteggio si azzera a ogni
  aggiornamento automatico, ma i riavvii non sono provocabili da chi attacca, e una
  tabella dedicata costerebbe una migrazione per un guadagno marginale.
  → [backend/src/services/loginRateLimit.ts](../backend/src/services/loginRateLimit.ts)

- **L'aggiornamento dell'app era lanciabile da qualsiasi utente autenticato**, non solo
  dall'amministratore: `/settings/update/run` non aveva `requireAdmin`, e il pannello era
  visibile a tutti nella UI (solo la sezione Utenti era filtrata). Non era un'incoerenza
  del file — nelle impostazioni solo il ripristino backup era riservato all'admin — ma
  quella rotta non cambia una preferenza: esegue sull'host il codice di `origin/main` e
  ricostruisce lo stack. Con l'app su internet, un singolo account compromesso non deve
  bastare per arrivarci. Ora le tre rotte `/settings/update*` richiedono `requireAdmin` e
  la sezione è nascosta ai non-admin, insieme a "Utenti", tramite un elenco unico di
  sezioni riservate invece di un controllo ripetuto per chiave.
  → [backend/src/routes/settings.ts](../backend/src/routes/settings.ts),
  [frontend/src/pages/settings/SettingsPage.tsx](../frontend/src/pages/settings/SettingsPage.tsx)

- **Il registro delle azioni utente aveva una copia locale della stessa logica**, che
  prendeva la prima entry di `X-Forwarded-For`: un log di controllo in cui l'IP è deciso da
  chi compie l'azione non serve a niente. Ora usa la stessa funzione del limitatore.
  → [backend/src/middleware/userActionLogger.ts](../backend/src/middleware/userActionLogger.ts)

- **Il cookie di sessione viaggiava senza `secure`**, cosa corretta finché l'unico accesso
  era HTTP in LAN. Ora è `secure` in produzione e resta in chiaro solo in sviluppo, dove il
  frontend gira su `http://localhost` e un cookie `secure` non verrebbe proprio inviato.
  Nessun attributo `domain`, come già prima: è ciò che permette di cambiare dominio senza
  toccare il codice.
  → [backend/src/middleware/requireAuth.ts](../backend/src/middleware/requireAuth.ts)

- **Il CORS è stato rimosso invece che ristretto.** Era `origin: true`, cioè "rifletti
  qualunque origine". Il piano era di fissarlo sull'origine di produzione, ma in produzione
  non esiste nessuna richiesta cross-origin: nginx serve frontend e `/api` dalla stessa
  origine. Non attivare il middleware è più sicuro che configurarlo, e toglie di mezzo
  l'unico valore che sarebbe andato aggiornato a ogni cambio di dominio. Resta attivabile
  in sviluppo tramite `CORS_ORIGIN`, dove Vite su `:5173` chiama il backend su `:3000` e le
  richieste sono cross-origin per davvero.
  → [backend/src/index.ts](../backend/src/index.ts),
  [docker-compose.dev.yml](../docker-compose.dev.yml)

- **Nessun container pubblica più porte sull'host.** La `3000:3000` del backend permetteva
  di scavalcare nginx, e con esso l'unico punto in cui l'IP del client è attendibile; la
  `80:80` del frontend non serve più, visto che cloudflared raggiunge nginx dalla rete
  interna della compose. Conseguenza voluta: dalla LAN, via IP, non si entra più. Il modo
  di riaprire un accesso di emergenza è annotato nel compose e nel README.
  → [docker-compose.yml](../docker-compose.yml)

- **Aggiunti gli header di sicurezza** (`nosniff`, `X-Frame-Options`/`frame-ancestors`,
  `Referrer-Policy`, HSTS), che non c'erano affatto. Stanno in uno snippet incluso, non
  scritti una volta sola nel blocco `server`, per un motivo preciso: in nginx un
  `add_header` dentro un `location` **annulla** tutti quelli ereditati, e due location qui
  ne hanno già uno per `Cache-Control` — sarebbero rimaste scoperte proprio `index.html` e
  gli asset statici. Lo snippet sta fuori da `conf.d/` perché nginx include da sé ogni
  `conf.d/*.conf` nel blocco `http`. Verificato che su tutte e tre le location gli header
  escano e il `Cache-Control` resti quello di prima.
  → [frontend/security-headers.conf](../frontend/security-headers.conf),
  [frontend/nginx.conf](../frontend/nginx.conf)

- **Il dominio si sceglie durante l'installazione** (`scripts/install-tunnel.sh`): lo
  script lo chiede, autorizza l'account Cloudflare, crea tunnel, ingress e record DNS.
  Rilanciarlo è anche il modo di cambiare dominio, perché modificare `config.yml` a mano
  aggiornerebbe l'ingress ma non il DNS. Il tunnel è gestito localmente e non a token
  proprio per questo: la configurazione deve stare sulla VM, non nella dashboard.
  L'applicazione continua a non conoscere il proprio dominio — `PUBLIC_DOMAIN` in `.env`
  serve solo a stamparlo all'avvio — quindi il cambio resta configurazione, mai una
  ricostruzione. Aggiunto a `edit-env.sh`, che riscrivendo `.env` dalla propria lista di
  chiavi altrimenti lo avrebbe cancellato a ogni esecuzione.
  *Trappola trovata alla prima esecuzione reale:* `cloudflared tunnel login` **ignora
  `--origincert`** quando decide dove scrivere il certificato, e usa sempre la propria
  directory di default (`/home/nonroot/.cloudflared` nell'immagine ufficiale). Montando la
  cartella dell'host altrove, il `cert.pem` finiva dentro il container `--rm` e spariva con
  lui, facendo fallire il comando successivo con "cannot find a valid certificate". Ora
  script e servizio compose montano entrambi su quel percorso: uno solo, quello che
  cloudflared usa comunque.
  Il record DNS viene creato **senza** `--overwrite-dns` al primo tentativo, chiedendo
  conferma solo se esiste già: il dominio ospita altri sottodomini in uso, e un errore di
  battitura avrebbe altrimenti dirottato in silenzio uno di quelli su EasyLab.
  → [scripts/install-tunnel.sh](../scripts/install-tunnel.sh),
  [scripts/edit-env.sh](../scripts/edit-env.sh),
  [scripts/start-server.sh](../scripts/start-server.sh)

- **Documentato un limite che si sarebbe scoperto durante un'emergenza:** il piano Free di
  Cloudflare taglia le richieste sopra i 100 MB, e nginx accetta fino a 2 GB proprio per il
  caricamento dei dump. Ripristinare un backup più grande dall'interfaccia web fallirà con
  un 413 generato da Cloudflare, non dall'app. Ripristinare un backup *già sul server* non
  è soggetto al limite; per un archivio esterno più grande resta `scripts/restore-db.sh`.
  → [README.md](../README.md), [frontend/nginx.conf](../frontend/nginx.conf)

---

## 2026-08-03 — Manifest completato per l'installazione come app (Chrome/Brave)

- **Il `site.webmanifest` aggiunto in precedenza (voce sotto) non bastava a far comparire
  l'icona di installazione** di Chrome/Brave: mancavano `start_url`, `scope` e `id`, campi
  che i criteri di installabilità di Chromium richiedono esplicitamente (senza `start_url`
  il browser non sa quale URL aprire dall'icona sulla home/desktop). Aggiunti insieme a
  `lang: "it"`. Non è stato aggiunto un service worker: non serve più ai criteri di
  installabilità attuali di Chromium, ed evita il rischio di cache-obsoleta con la feature
  di auto-update già presente (vedi il commento su `/index.html` in `nginx.conf`).
  **Nota:** l'icona di installazione compare solo su un'origine "sicura" (HTTPS o
  `localhost`) — da un altro dispositivo in LAN via IP su HTTP semplice (situazione attuale,
  vedi [[project_internet_exposure_plan]]) Chrome/Brave non la mostrano; funziona già oggi
  aprendo il sito da `localhost` sulla stessa macchina del server.
  → [frontend/public/site.webmanifest](../frontend/public/site.webmanifest)

---

## 2026-08-03 — Rinominato il progetto da Masso a EasyLab

- **Il nome "Masso" viene sostituito da "EasyLab"** ovunque nel codice: testo visibile
  (titolo pagina, webmanifest, login, placeholder impostazioni, email di test), slug di
  progetto (`masso-web` → `easylab-web` in `package.json`, chiavi `localStorage` del tema
  e del calendario), unit systemd (`masso-update.*`/`masso-check-updates.*` →
  `easylab-update.*`/`easylab-check-updates.*`), valori di esempio in `.env.example` e
  `scripts/edit-env.sh` (`POSTGRES_USER`/`POSTGRES_DB`/`BACKUP_HOST_DIR`/`LAB_NAME`/
  `LAB_EMAIL`), e i riferimenti in `README.md` e negli script di deploy
  (`configure-static-ip.sh`, `install-updater.sh`, `restore-db.sh`).
  Il repository GitHub e l'eventuale deploy esistente in `/opt/masso-web` restano da
  rinominare a mano sul server (`gh` non era disponibile in questo ambiente per farlo
  automaticamente); rinominare le unit systemd installate su una VM già in produzione
  richiede di rilanciare `scripts/install-updater.sh` dopo il pull.
  → [.env.example](../.env.example), [README.md](../README.md),
  [frontend/index.html](../frontend/index.html),
  [frontend/public/site.webmanifest](../frontend/public/site.webmanifest),
  [frontend/package.json](../frontend/package.json),
  [frontend/src/lib/theme.ts](../frontend/src/lib/theme.ts),
  [frontend/src/lib/calendarView.ts](../frontend/src/lib/calendarView.ts),
  [backend/src/services/companyManager.ts](../backend/src/services/companyManager.ts),
  [backend/src/services/emailManager.ts](../backend/src/services/emailManager.ts),
  [ops/systemd/](../ops/systemd/), [scripts/](../scripts/)

---

## 2026-08-03 — Favicon e icona app al posto del default di Vite

- **L'app usava ancora la favicon di default di Vite** (`vite.svg`), mai sostituita dal
  set di icone del progetto. Aggiunto il set EasyLab (`svg`, `32px`, `apple-touch 180px`,
  `192`/`512`) in `frontend/public/` e collegato da `index.html`; aggiunto anche un
  `site.webmanifest` che referenzia le icone 192/512 per il salvataggio in home screen su
  mobile (nessun service worker/PWA plugin configurato, resta solo l'icona).
  → [frontend/index.html](../frontend/index.html),
  [frontend/public/site.webmanifest](../frontend/public/site.webmanifest)

---

## 2026-07-31 — Contenuto lo scroll della tabella Log in Impostazioni

- **La sezione Log delle Impostazioni scrollava per intero** (filtri, tabella e paginazione
  insieme), invece di contenere lo scroll nella sola tabella come nelle altre pagine
  (Interventi, Rapporti, ecc.). `SettingsCard` non esponeva un `className` per il `Card`
  esterno, quindi `LogsSettingsPanel` non poteva farlo diventare una colonna flex a
  altezza piena con la tabella come unica area `overflow-y-auto`. Aggiunta la prop
  `className` a `SettingsCard` (usata solo da questo pannello: gli altri restano invariati)
  e reso `LogsSettingsPanel` una colonna flex con selettore data/ricerca e paginazione
  fissi e solo il riquadro della tabella scrollabile.
  → [frontend/src/components/settings/settingsUi.tsx](../frontend/src/components/settings/settingsUi.tsx),
  [frontend/src/components/settings/logsSettingsPanel.tsx](../frontend/src/components/settings/logsSettingsPanel.tsx)

---

## 2026-07-31 — Doppio click sul calendario per creare un intervento, hover righe tabella più rapido

- **Doppio click su una cella libera del calendario interventi (dashboard) apre "Nuovo
  intervento" con la data già precompilata.** Il click singolo resta riservato al
  drag-to-select nativo di `react-big-calendar`, quindi si distingue tramite
  `slotInfo.action === "doubleClick"` in `onSelectSlot` (richiede la prop `selectable`).
  Aggiunta la prop opzionale `initialDate` a `CreateInterventionDialog` per precompilare il
  campo data all'apertura.
  → [frontend/src/pages/calendar/components/interventions-calendar.tsx](../frontend/src/pages/calendar/components/interventions-calendar.tsx),
  [frontend/src/components/dialogs/create/createInterventionDialog.tsx](../frontend/src/components/dialogs/create/createInterventionDialog.tsx)

- **Nuovo bottone "Nuovo intervento" in dashboard, accanto a "Nuovo rapportino".** La
  creazione dell'intervento (risoluzione cliente, chiamata API, refresh) è stata spostata
  da `interventions-calendar.tsx` a `DashboardPage`, che ora possiede anche l'hook
  `useCalendarInterventions` e lo passa come props (`events`, `isLoading`) al calendario:
  così sia il bottone in alto sia il doppio click su una cella condividono la stessa
  logica di creazione, e il calendario e i contatori delle card si aggiornano insieme
  senza reload della pagina.
  → [frontend/src/pages/dashboard/DashboardPage.tsx](../frontend/src/pages/dashboard/DashboardPage.tsx),
  [frontend/src/pages/calendar/components/interventions-calendar.tsx](../frontend/src/pages/calendar/components/interventions-calendar.tsx)

- **Transizione hover delle righe tabella accorciata** (da 150ms di default Tailwind a
  50ms) perché risultava percettibilmente lenta.
  → [frontend/src/components/ui/table.tsx](../frontend/src/components/ui/table.tsx)

---

## 2026-07-31 — Pagine "report cliente" e "interventi cliente", e fix del live-reload in sviluppo

- **Nuovo bottone "apri interventi" nella tabella Clienti, distinto da "apri report".**
  Prima la tabella Clienti aveva un solo bottone (icona generica) per aprire la pagina dei
  report del cliente; mancava l'equivalente per gli interventi. Ora ogni riga ha due
  bottoni di apertura: `ClipboardList` (giallo) per i report, `HardHat` (azzurro) per gli
  interventi — le stesse icone già usate per le voci "Rapporti" e "Interventi" nella
  sidebar. I due bottoni di stampa resoconto restano `Printer`, stessi colori di prima.
  → [frontend/src/pages/customers/components/customers-table.tsx](../frontend/src/pages/customers/components/customers-table.tsx)

- **La pagina dei report di un cliente (`/clients/:id`) ora usa una tabella invece delle
  card**, per essere coerente con Rapporti/Interventi/tutte le altre liste dell'app (stessa
  struttura tabella desktop + card list mobile, stesso colore di riga per stato). Aggiunto
  anche un bottone "Stampa" in alto a destra (prima la stampa del resoconto era disponibile
  solo dalla tabella Clienti).
  → [frontend/src/pages/customers/CustomerPage.tsx](../frontend/src/pages/customers/CustomerPage.tsx)

- **Nuova pagina `/clients/:id/interventions`**, analoga alla precedente ma per gli
  interventi del cliente: tabella con filtro per stato, paginazione e bottone "Stampa" in
  alto a destra.
  → [frontend/src/pages/customers/CustomerInterventionsPage.tsx](../frontend/src/pages/customers/CustomerInterventionsPage.tsx)

- **Vite non rilevava le modifiche ai file nel container di sviluppo.** Su Docker Desktop
  per Windows i bind mount non propagano gli eventi inotify nativi nel container Linux:
  il file cambiava (visibile dentro il container), ma chokidar non se ne accorgeva e
  l'HMR non scattava mai. Aggiunto `server.watch.usePolling: true` a `vite.config.ts`.
  → [frontend/vite.config.ts](../frontend/vite.config.ts)

- **Volume `frontend_node_modules` disallineato da `package.json`.** Il volume nominato
  persisteva da prima dell'introduzione di Vitest (commit `ae577c8`) e non veniva mai
  aggiornato ai riavvii, perché Docker ripopola un volume nominato solo se vuoto: il
  container falliva ad avviarsi con `Cannot find package 'vitest'` non appena veniva
  ricreato/riavviato. Reinstallate le dipendenze nel volume esistente. Notato anche che
  il tag immagine `masso-web-frontend:latest` è condiviso tra `docker-compose.yml`
  (produzione, nginx) e `docker-compose.dev.yml` (sviluppo, Vite): nessuno dei due
  specifica un `image:` esplicito, quindi l'ultima build eseguita sovrascrive il tag
  dell'altra. Da valutare l'assegnazione di nomi immagine distinti per evitare che una
  build di produzione rompa silenziosamente l'ambiente di sviluppo (o viceversa).

## 2026-07-31 — Scroll delle tabelle contenuto e stato del bottone di aggiornamento

- **Bottone "Aggiorna adesso" disabilitato quando non c'è nulla da aggiornare.** Prima
  restava cliccabile anche a `updateAvailable: false`, permettendo di avviare un
  aggiornamento (rebuild dei container, breve downtime) senza motivo.
  → [frontend/src/components/settings/updateSettingsPanel.tsx](../frontend/src/components/settings/updateSettingsPanel.tsx)

- **Solo la tabella scorre, non l'intera pagina.** Nelle liste (Clienti, Interventi,
  Rapporti, Tecnici, Difetti, Collaboratori, Dispositivi), con molte righe scorreva
  l'intero `<main>`, portando fuori vista intestazione, filtri e paginazione.
  *Perché:* queste pagine erano un flex-column senza un contenitore verticale delimitato:
  il contenuto cresceva oltre il viewport e il browser applicava lo scroll al livello più
  esterno che lo consentiva (`<main>`). Ora ogni pagina occupa `h-full` e solo il blocco
  della tabella è `flex-1 overflow-y-auto`; la paginazione, fuori da quel blocco, resta
  sempre visibile in fondo. Verificato con Playwright iniettando righe extra: `main` non
  supera più l'altezza del viewport, solo il contenitore della tabella scrolla.
  → `frontend/src/pages/{customers/CustomersPage,interventions/InterventionsPage,reports/ReportsPage,technicians/TechniciansPage,issues/IssuesPage,collaborators/CollaboratorsPage,devices/DevicesPage}.tsx`

## 2026-07-31 — Affidabilità, test del frontend e riduzione dei file monolitici

Passata di manutenzione su punti emersi da una revisione del codice. Nessuna modifica
funzionale visibile all'utente: cambiano robustezza, copertura di test e organizzazione.

### Affidabilità in esecuzione

- **Arresto pulito del backend.** `SIGTERM`/`SIGINT` ora fermano gli scheduler, smettono di
  accettare connessioni, lasciano finire le richieste in volo e chiudono il pool
  PostgreSQL, con un limite di 10s oltre il quale si esce comunque.
  *Perché:* l'aggiornamento automatico ricrea i container a ogni update, quindi il backend
  riceve `SIGTERM` di routine, non in casi eccezionali; prima ogni aggiornamento troncava
  le richieste in corso (un download PDF, una scrittura di backup) e chiudeva di colpo le
  connessioni al database.
  → [backend/src/index.ts](../backend/src/index.ts), [backend/src/db/index.ts](../backend/src/db/index.ts)

- **`exec` nel comando del container backend.** `docker-compose.yml` ora lancia
  `sh -c 'node migrate.js && exec node dist/src/index.js'` e dichiara
  `stop_grace_period: 30s`.
  *Perché:* senza `exec`, `sh` resta PID 1 e non inoltra `SIGTERM` al processo Node —
  l'arresto pulito qui sopra non verrebbe mai eseguito e Docker ucciderebbe il container
  con `SIGKILL`. La grace period è più ampia del timeout applicativo così l'arresto ha il
  tempo di completarsi. Rimosso anche l'`echo "DATABASE_URL=..."` iniziale, che stampava
  la password del database nei log del container.
  → [docker-compose.yml](../docker-compose.yml)

- **Healthcheck su backend e frontend.** Prima ce l'aveva solo `db`. Il frontend ora
  dipende dal backend con `condition: service_healthy`.
  *Perché:* `restart: always` copre il processo morto, non quello vivo ma bloccato.
  L'endpoint `/api/health` esisteva già e non lo usava nessuno.
  → [docker-compose.yml](../docker-compose.yml)

- **Pulizia periodica delle sessioni scadute** (ogni ora, più una passata all'avvio).
  *Perché:* `getSessionUser` cancellava una sessione scaduta solo se qualcuno presentava
  proprio quel token; le sessioni di chi chiude il browser e non torna più restavano in
  tabella per sempre.
  → [backend/src/services/authManager.ts](../backend/src/services/authManager.ts)

- **Tetto di sicurezza sulle liste non paginate** (5000 righe, con warning nei log quando
  scatta). Omettere `page`/`pageSize` resta legittimo e voluto — combobox e dashboard
  hanno bisogno dell'elenco completo — ma la query non è più illimitata.
  *Perché:* senza `limit` la query cresce con la tabella e a un certo volume carica in
  memoria l'intero contenuto a ogni richiesta. Il limite è molto sopra i volumi reali,
  quindi oggi non cambia nulla; il warning serve perché una troncatura silenziosa (una
  combobox a cui mancano voci) sarebbe difficilissima da diagnosticare.
  → [backend/src/db/queries/pagination.ts](../backend/src/db/queries/pagination.ts) e le 7 query di lista

- **`ensureDefaultAdmin` ora ha un `.catch`.** Era invocata con `void` e senza gestione
  dell'errore.
  *Perché:* trovato durante la verifica in container dello spegnimento pulito — con il
  database irraggiungibile il backend si avviava, stampava "Server running" e subito dopo
  moriva per rejection non gestita (Node 24 termina il processo). In produzione il
  problema è mascherato da `depends_on: service_healthy`, ma un intoppo momentaneo non
  deve abbattere il server: ora l'errore viene registrato e l'admin sarà creato al
  riavvio successivo.
  → [backend/src/index.ts](../backend/src/index.ts)

- **Log per richiesta su stdout** con metodo, percorso, stato e durata, e marcatura
  `slow=true` oltre 1s. Formato `chiave=valore` come il log azioni utente esistente.
  *Perché:* mancava qualunque traccia delle GET e dei tempi di risposta: quando qualcosa
  risultava lento non c'era niente su cui lavorare. Complementare a `userActionLogger`,
  che registra su file solo le modifiche ai dati, per audit.
  → [backend/src/middleware/requestLogger.ts](../backend/src/middleware/requestLogger.ts)

### Test

- **Il frontend ora ha dei test.** Vitest + Testing Library + jsdom, 33 test su 6 file,
  aggiunti allo stesso job CI di lint/typecheck/build.
  *Perché:* era il buco più grosso rimasto — il backend aveva 40 test, il frontend zero, e
  la CI si fermava a typecheck e build. La logica più delicata sta lì.
  Coperti: la guardia anti-race di `usePaginatedRows` (le risposte lente di richieste
  superate non devono sovrascrivere la tabella), `useTablePagination`,
  `useDebouncedValue`, `getApiErrorMessage`, le preferenze di tema salvate in
  `localStorage`, e `AppErrorBoundary` come primo test di componente.
  *Verifica dei test stessi:* disattivando la guardia in `usePaginatedRows` i due test
  relativi falliscono, quindi rilevano davvero la regressione.
  → [frontend/vite.config.ts](../frontend/vite.config.ts), [frontend/src/test/setup.ts](../frontend/src/test/setup.ts), i file `*.test.ts(x)`

### Verifiche eseguite

Pipeline CI completa verde su entrambe le app: lint, format (backend), typecheck, test
(40 backend + 33 frontend), build. `docker compose --env-file .env.example config`
interpola correttamente.

Lo spegnimento pulito è stato provato davvero, in container con un PostgreSQL usa e getta,
perché dipende dalla consegna del segnale e non è verificabile da un test unitario:
`ps` conferma che PID 1 è `node dist/src/index.js` (quindi `exec` fa il suo lavoro), il
comando dell'healthcheck restituisce `{"status":"ok"}`, e `docker stop` produce
"Ricevuto SIGTERM" → "Arresto completato." con uscita 0 in **1 secondo**, invece dei 10
secondi che precedevano il `SIGKILL`.

### Organizzazione del codice

- **`backupManager.ts` diviso in 7 moduli** (1092 righe → il maggiore è 293). Il file
  resta la facciata: rotte e test continuano a importare da lì, le riesportazioni tengono
  stabile l'API pubblica.
  *Perché:* mescolava impostazioni persistite, invocazione di processi esterni, protocollo
  SMB, ripristino e scheduler. La suddivisione è per responsabilità, con `backupError` e
  `backupLock` isolati apposta per non creare cicli di import fra dump e ripristino.
  → `backend/src/services/backup{Error,Files,Lock,Process,Restore,Smb,State,Manager}.ts`

- **`backupSettingsPanel.tsx` diviso in 8 file** (979 righe → 29 nel pannello). Stato e
  azioni in `useBackupPanel`, una scheda per file.
  *Perché:* un solo componente teneva ~25 variabili di stato e ~560 righe di JSX. Le
  schede ricevono l'oggetto dell'hook come unica prop: condividono lo stesso stato, e
  enumerarne i campi nelle firme non aggiungerebbe informazione.
  → [frontend/src/components/settings/backup/](../frontend/src/components/settings/backup/)

- **Prettier anche sul backend**, con config propria (4 spazi, `semi: true`, 120 colonne)
  invece di quella del frontend (2 spazi, `semi: false`, 80 colonne). `format:check` è ora
  uno step della CI.
  *Perché:* riusare la config del frontend avrebbe riformattato l'intero backend
  seppellendo i diff veri — era il motivo per cui Prettier qui era stato saltato. Una
  config allineata allo stile già in uso risolve il problema.
  → [backend/.prettierrc](../backend/.prettierrc), [.github/workflows/ci.yml](../.github/workflows/ci.yml)

### Codice morto rimosso

- **`reportPdfLegacy.ts`** (361 righe) e la variabile `REPORT_PDF_LAYOUT`. Il layout
  "sections" introdotto in `ac067e4` è ora l'unico.
  *Perché:* mantenere due generatori PDF allineati a ogni modifica del report è un costo
  ricorrente per un fallback mai usato. Resta recuperabile da git.
- **`backend/src/templates/reportPrintTemplate.ts`** (403 righe), generatore HTML
  precedente al passaggio a pdfmake, non referenziato da nessuna parte.

### Verificato, nessun intervento necessario

- **Accessibilità.** Controllati tutti i `.tsx` fuori da `components/ui/`: ogni bottone con
  sola icona ha già un `aria-label` (77 in totale), nessun `<img>` è senza `alt`, ogni
  `<Input>` ha un `<Label>` associato, e `index.html` dichiara già `lang="it"`. La
  segnalazione iniziale ("aria-label sporadici") derivava da un conteggio per file che
  contava anche i file privi di bottoni: era sbagliata.
- **Endpoint `/print`.** Erano indicati come possibile causa di caricamenti illimitati:
  in realtà sono per-id (un PDF per un record) e non esiste alcun endpoint di stampa
  massiva. La generazione del PDF resta sincrona, ma per un solo documento.

### Note

- `npm audit` sul frontend segnala 2 vulnerabilità high in `react-router` (advisory
  GHSA-qwww-vcr4-c8h2). Riguardano la modalità RSC, che questa SPA non usa; la correzione
  richiederebbe un downgrade breaking a 7.11. Non affrontato in questa passata.
