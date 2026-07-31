import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Esportato perché lo spegnimento pulito (src/index.ts) deve chiudere le connessioni
// aperte: senza `pool.end()` il processo viene terminato con query ancora in volo.
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
