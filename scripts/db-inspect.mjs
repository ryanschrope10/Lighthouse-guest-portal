import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing. Run with: node --env-file=.env.local scripts/db-inspect.mjs');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
  order by table_name
`;

console.log('Existing public tables:');
for (const r of rows) console.log('  -', r.table_name);
console.log('total:', rows.length);
