import { createTestDb } from '@/db/testDb';
import { countDue, getCard, saveCard } from '@/db/cards';
import { createScheduler } from '@/engine/scheduler/scheduler';
import { installPack } from './install';
import { validatePack } from './validate';

const pack = validatePack(require('../../packs/test.pack.json'));

describe('installPack', () => {
  it('le pack de test fourni est valide', () => {
    expect(pack.words.length).toBeGreaterThan(20);
    expect(pack.sentences.length).toBeGreaterThan(20);
  });

  it('installe mots, phrases et une carte neuve par phrase', async () => {
    const db = await createTestDb();
    await installPack(db, pack, 1000);
    const n = await db.get<{ n: number }>('SELECT COUNT(*) n FROM cards WHERE lang=? AND state=0', [
      'it',
    ]);
    expect(n?.n).toBe(pack.sentences.length);
    expect(await countDue(db, 'it', 1e12)).toBe(0); // neuves ≠ dues
  });

  it('est idempotente et conserve la progression', async () => {
    const db = await createTestDb();
    const s = createScheduler({ fuzz: false });
    await installPack(db, pack, 1000);
    const reviewed = s.review((await getCard(db, 'it', 's1'))!, 'good', 2000);
    await saveCard(db, 'it', 's1', reviewed);
    await installPack(db, pack, 3000);
    expect(await getCard(db, 'it', 's1')).toEqual(reviewed);
    const n = await db.get<{ n: number }>('SELECT COUNT(*) n FROM cards');
    expect(n?.n).toBe(pack.sentences.length);
  });

  it('une mise à jour ajoute les nouvelles phrases sans toucher aux anciennes', async () => {
    const db = await createTestDb();
    await installPack(db, pack, 1000);
    const bigger = {
      ...pack,
      packVersion: '0.0.2',
      sentences: [...pack.sentences, { ...pack.sentences[0], id: 'sNEW', text: 'Ciao ciao!' }],
    };
    await installPack(db, bigger, 2000);
    const n = await db.get<{ n: number }>('SELECT COUNT(*) n FROM cards');
    expect(n?.n).toBe(pack.sentences.length + 1);
  });

  it('la carte revue devient due à son échéance', async () => {
    const db = await createTestDb();
    const s = createScheduler({ fuzz: false });
    await installPack(db, pack, 1000);
    const c = s.review((await getCard(db, 'it', 's2'))!, 'good', 2000);
    await saveCard(db, 'it', 's2', c);
    expect(await countDue(db, 'it', c.due - 1)).toBe(0);
    expect(await countDue(db, 'it', c.due)).toBe(1);
  });
});
