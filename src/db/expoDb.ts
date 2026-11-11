import * as SQLite from 'expo-sqlite';
import type { Db, SqlValue } from './db';
import { migrate } from './migrations';

let instance: Promise<Db> | null = null;

/** Ouvre (une seule fois) la base locale et applique les migrations. */
export function getDb(): Promise<Db> {
  instance ??= (async () => {
    const raw = await SQLite.openDatabaseAsync('ispeak.db');
    await raw.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    const db: Db = {
      exec: (sql) => raw.execAsync(sql),
      run: async (sql, params = []) => void (await raw.runAsync(sql, params as SqlValue[])),
      all: <T>(sql: string, params: SqlValue[] = []) => raw.getAllAsync<T>(sql, params),
      get: async <T>(sql: string, params: SqlValue[] = []) =>
        (await raw.getFirstAsync<T>(sql, params)) ?? null,
      transaction: (fn) => raw.withTransactionAsync(fn),
    };
    await migrate(db);
    return db;
  })();
  return instance;
}
