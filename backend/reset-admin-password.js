// Rigenera la password di un utente direttamente sul database, per i casi in cui
// nessuno riesca più ad accedere all'app (es. unico utente rimasto e password persa).
// Eseguito dentro il container backend da scripts/reset-admin-password.{sh,ps1}.
// Usage: node reset-admin-password.js [username]  (default: admin)
const crypto = require('crypto');
const { Pool } = require('pg');

const scryptKeyLength = 64;
const generatedPasswordAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const generatedPasswordLength = 16;

const hashPassword = (password) =>
    new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, scryptKeyLength, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });

const generateRandomPassword = (length = generatedPasswordLength) => {
    const bytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i += 1) {
        password += generatedPasswordAlphabet[bytes[i] % generatedPasswordAlphabet.length];
    }
    return password;
};

async function main() {
    const username = process.argv[2] || 'admin';
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    try {
        const { rows } = await pool.query('SELECT id FROM "user" WHERE username = $1', [username]);

        if (rows.length === 0) {
            console.error(`Utente "${username}" non trovato.`);
            process.exitCode = 1;
            return;
        }

        const userId = rows[0].id;
        const password = generateRandomPassword();
        const passwordHash = await hashPassword(password);

        await pool.query(
            'UPDATE "user" SET password_hash = $1, must_change_password = true WHERE id = $2',
            [passwordHash, userId]
        );
        await pool.query('DELETE FROM "session" WHERE user_id = $1', [userId]);

        console.log('============================================================');
        console.log(`Password rigenerata per l'utente "${username}":`);
        console.log(`  password: ${password}`);
        console.log("Dovrà essere cambiata al primo accesso. Eventuali sessioni attive per");
        console.log("questo utente sono state disconnesse.");
        console.log('============================================================');
    } finally {
        await pool.end();
    }
}

main().catch((error) => {
    console.error('Errore durante il reset della password:', error);
    process.exitCode = 1;
});
