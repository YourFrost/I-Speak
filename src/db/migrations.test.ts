import { MIGRATIONS, migrate } from './migrations';
import { createTestDb } from './testDb';

describe('migrations', () => {
  it('crée le schéma et fixe user_version', async () => {
    const db = await createTestDb();
    const v = await db.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(MIGRATIONS.length);
    const t = await db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'");
    expect(t.map((r) => r.name)).toEqual(
      expect.arrayContaining(['cards', 'review_logs', 'profiles']),
    );
  });
  it('est idempotente', async () => {
    const db = await createTestDb();
    await migrate(db);
    await migrate(db);
  });
  it('refuse une base plus récente que l’appli', async () => {
    const db = await createTestDb();
    await db.exec(`PRAGMA user_version = ${MIGRATIONS.length + 1}`);
    await expect(migrate(db)).rejects.toThrow(/plus récente/);
  });
});
