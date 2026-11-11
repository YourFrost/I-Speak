import { addReviewLog, getCard, saveCard } from '@/db/cards';
import type { Db } from '@/db/db';
import type { AppRating, Scheduler } from '../scheduler/scheduler';

/** Applique une note à une carte : met à jour FSRS, écrit le log et les stats du jour (atomique). */
export async function recordReview(
  db: Db,
  sched: Scheduler,
  args: {
    lang: string;
    sentenceId: string;
    rating: AppRating;
    exerciseType: string;
    now: number;
    durationMs?: number | null;
  },
): Promise<void> {
  const card = await getCard(db, args.lang, args.sentenceId);
  if (!card) throw new Error(`Carte introuvable : ${args.sentenceId}`);
  const next = sched.review(card, args.rating, args.now);
  const date = new Date(args.now).toISOString().slice(0, 10);
  await db.transaction(async () => {
    await saveCard(db, args.lang, args.sentenceId, next);
    await addReviewLog(db, {
      lang: args.lang,
      sentenceId: args.sentenceId,
      rating: args.rating,
      exerciseType: args.exerciseType,
      at: args.now,
      durationMs: args.durationMs ?? null,
      stateBefore: card.state,
    });
    await db.run(
      `INSERT INTO daily_stats (lang,date,new_count,review_count,seconds_spent) VALUES (?,?,?,?,?)
       ON CONFLICT(lang,date) DO UPDATE SET new_count=new_count+excluded.new_count,
         review_count=review_count+excluded.review_count, seconds_spent=seconds_spent+excluded.seconds_spent`,
      [
        args.lang,
        date,
        card.state === 0 ? 1 : 0,
        card.state === 0 ? 0 : 1,
        Math.round((args.durationMs ?? 0) / 1000),
      ],
    );
  });
}
