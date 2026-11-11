/** Base SQLite en mémoire pour les tests (node:sqlite, aucune dépendance native). */
import type { Db, SqlValue } from './db';
import { migrate } from './migrations';

export async function createTestDb(): Promise<Db> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite');
  const raw = new DatabaseSync(':memory:');
  let depth = 0;
  const db: Db = {
    exec: async (sql) => void raw.exec(sql),
    run: async (sql, params = []) => void raw.prepare(sql).run(...(params as SqlValue[])),
    all: async <T>(sql: string, params: SqlValue[] = []) => raw.prepare(sql).all(...params) as T[],
    get: async <T>(sql: string, params: SqlValue[] = []) =>
      (raw.prepare(sql).get(...params) as T | undefined) ?? null,
    transaction: async (fn) => {
      if (depth++ === 0) raw.exec('BEGIN');
      try {
        await fn();
        if (--depth === 0) raw.exec('COMMIT');
      } catch (e) {
        depth = 0;
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
  await migrate(db);
  return db;
}
