/** Interface minimale de base de données (async), implémentée par expo-sqlite et par node:sqlite en test. */
export type SqlValue = string | number | null;

export interface Db {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<void>;
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  get<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  /** Exécute `fn` dans une transaction : tout ou rien. */
  transaction(fn: () => Promise<void>): Promise<void>;
}
