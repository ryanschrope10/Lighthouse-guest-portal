import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

export function getSQL() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Re-export as `sql` for convenience — calls getSQL() lazily via a proxy
export const sql: NeonQueryFunction<false, false> = new Proxy(
  {} as NeonQueryFunction<false, false>,
  {
    apply(_target, _thisArg, args) {
      return getSQL()(...(args as [TemplateStringsArray, ...unknown[]]));
    },
    get(_target, prop) {
      return Reflect.get(getSQL(), prop);
    },
  },
);
