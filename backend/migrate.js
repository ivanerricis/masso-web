const path = require('path');
const fs = require('fs');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

async function runMigrations() {
  const migrationsDir = path.resolve('/app/drizzle');
  console.log('Migrations directory:', migrationsDir);
  console.log('Migrations directory exists:', fs.existsSync(migrationsDir));
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir);
    console.log('Files in migrations directory:', files);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    const connection = await pool.connect();
    console.log('Connected!');
    connection.release();

    const db = drizzle(pool);
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: migrationsDir });
    console.log('Migrations applied successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('MIGRATION ERROR:');
    console.error(error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
