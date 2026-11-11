import { countDue, getCard } from '@/db/cards';
import { createTestDb } from '@/db/testDb';
import { installPack } from '@/packs/install';
import { validatePack } from '@/packs/validate';
import { buildTranslate, gradeTranslate } from '../exercises/translate';
import { createScheduler } from '../scheduler/scheduler';
import { pickNewFromDb } from './pickNew';
import { recordReview } from './review';

const pack = validatePack(require('../../../packs/test.pack.json'));
const sched = createScheduler({ fuzz: false });

describe('session : de la sélection à la révision', () => {
  it('pickNewFromDb part des mots les plus fréquents', async () => {
    const db = await createTestDb();
    await installPack(db, pack, 0);
    const ids = await pickNewFromDb(db, 'it', 3);
    expect(ids).toHaveLength(3);
    expect(ids[0]).toBe('s1'); // « Ciao! » : un seul mot, rang 1
  });

  it('une révision réussie planifie la carte, écrit le log et les stats', async () => {
    const db = await createTestDb();
    await installPack(db, pack, 0);
    const T = Date.UTC(2026, 0, 1);
    const ex = buildTranslate({ id: 's1', text: 'Ciao!', fr: 'Salut !' });
    const { rating } = gradeTranslate(ex, 'ciao');
    await recordReview(db, sched, {
      lang: 'it',
      sentenceId: 's1',
      rating,
      exerciseType: ex.type,
      now: T,
    });
    const c = (await getCard(db, 'it', 's1'))!;
    expect(c.reps).toBe(1);
    expect(c.due).toBeGreaterThan(T);
    expect(await countDue(db, 'it', c.due)).toBe(1);
    const log = await db.get<{ rating: string; state_before: number }>('SELECT * FROM review_logs');
    expect(log).toMatchObject({ rating: 'good', state_before: 0 });
    const st = await db.get<{ new_count: number; review_count: number }>(
      'SELECT * FROM daily_stats',
    );
    expect(st).toMatchObject({ new_count: 1, review_count: 0 });
  });

  it('une faute donne « again » et la carte revient vite', async () => {
    const db = await createTestDb();
    await installPack(db, pack, 0);
    const T = Date.UTC(2026, 0, 1);
    const ex = buildTranslate({ id: 's1', text: 'Ciao!', fr: 'Salut !' });
    await recordReview(db, sched, {
      lang: 'it',
      sentenceId: 's1',
      rating: 'good',
      exerciseType: ex.type,
      now: T,
    });
    const due = (await getCard(db, 'it', 's1'))!.due;
    const { rating } = gradeTranslate(ex, 'ciaone');
    expect(rating).toBe('again');
    await recordReview(db, sched, {
      lang: 'it',
      sentenceId: 's1',
      rating,
      exerciseType: ex.type,
      now: due,
    });
    const c = (await getCard(db, 'it', 's1'))!;
    expect(c.lapses).toBe(1);
  });
});
