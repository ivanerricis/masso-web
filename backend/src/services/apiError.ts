/**
 * Errore applicativo con un messaggio già destinato al client.
 *
 * A differenza di un errore imprevisto — di cui non sappiamo cosa contenga e che quindi
 * viene sostituito da un messaggio generico in `middleware/errorHandler.ts` — un `ApiError`
 * è sollevato di proposito da un servizio che sa cosa è andato storto e come dirlo a chi
 * sta usando l'app ("Il file di dump non esiste più", "Credenziali non valide").
 *
 * Esiste una sola classe perché ogni servizio ne aveva una propria identica, e a ognuna
 * corrispondeva una copia del codice che la traduceva in risposta HTTP dentro le rotte. Le
 * sottoclassi qui sotto restano solo dove il servizio le usa per distinguere i *propri*
 * errori da quelli altrui; per rispondere al client basta `instanceof ApiError`, gestito
 * una volta sola dal middleware degli errori.
 */
export class ApiError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.name = new.target.name;
        this.statusCode = statusCode;
    }
}
