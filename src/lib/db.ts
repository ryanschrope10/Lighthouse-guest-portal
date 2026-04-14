import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

function getSQL() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Tagged template wrapper that lazily initialises the Neon connection
// so the module can be imported at build time without DATABASE_URL.
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getSQL()(strings, ...values);
}
