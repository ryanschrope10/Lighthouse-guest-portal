import { Pool } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing. Run with: node --env-file=.env.local scripts/db-apply.mjs <file.sql> [file2.sql ...]');
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('No SQL files provided.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  for (const file of files) {
    const sql = await readFile(file, 'utf8');
    console.log(`Applying ${file} ...`);
    await client.query(sql);
    console.log(`  ✓ done`);
  }
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}

console.log('All migrations applied.');
