import type { CardState } from '@/engine/scheduler/scheduler';
import type { Db } from './db';

export interface CardRow {
  sentence_id: string;
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  state: number;
  last_review: number | null;
}

export function rowToState(r: CardRow): CardState {
  return {
    due: r.due,
    stability: r.stability,
    difficulty: r.difficulty,
    elapsedDays: r.elapsed_days,
    scheduledDays: r.scheduled_days,
    reps: r.reps,
    lapses: r.lapses,
    learningSteps: r.learning_steps,
    state: r.state,
    lastReview: r.last_review,
  };
}

export async function getCard(db: Db, lang: string, sentenceId: string): Promise<CardState | null> {
  const r = await db.get<CardRow>('SELECT * FROM cards WHERE lang=? AND sentence_id=?', [
    lang,
    sentenceId,
  ]);
  return r ? rowToState(r) : null;
}

/** Phrases dues (cartes déjà vues, échéance passée), les plus en retard d'abord. */
export function listDue(db: Db, lang: string, now: number, limit = 200) {
  return db.all<{ sentence_id: string }>(
    `SELECT sentence_id FROM cards WHERE lang=? AND state<>0 AND suspended=0 AND due<=?
     ORDER BY due ASC LIMIT ?`,
    [lang, now, limit],
  );
}

export async function countDue(db: Db, lang: string, now: number): Promise<number> {
  const r = await db.get<{ n: number }>(
    'SELECT COUNT(*) n FROM cards WHERE lang=? AND state<>0 AND suspended=0 AND due<=?',
    [lang, now],
  );
  return r?.n ?? 0;
}

export async function saveCard(
  db: Db,
  lang: string,
  sentenceId: string,
  c: CardState,
): Promise<void> {
  await db.run(
    `UPDATE cards SET due=?,stability=?,difficulty=?,elapsed_days=?,scheduled_days=?,reps=?,
       lapses=?,learning_steps=?,state=?,last_review=? WHERE lang=? AND sentence_id=?`,
    [
      c.due,
      c.stability,
      c.difficulty,
      c.elapsedDays,
      c.scheduledDays,
      c.reps,
      c.lapses,
      c.learningSteps,
      c.state,
      c.lastReview,
      lang,
      sentenceId,
    ],
  );
}

export async function addReviewLog(
  db: Db,
  l: {
    lang: string;
    sentenceId: string;
    rating: string;
    exerciseType: string;
    at: number;
    durationMs: number | null;
    stateBefore: number;
  },
): Promise<void> {
  await db.run(
    `INSERT INTO review_logs (lang,sentence_id,rating,exercise_type,reviewed_at,duration_ms,state_before)
     VALUES (?,?,?,?,?,?,?)`,
    [l.lang, l.sentenceId, l.rating, l.exerciseType, l.at, l.durationMs, l.stateBefore],
  );
}
