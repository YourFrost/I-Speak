import type { Db } from '@/db/db';
import { createScheduler } from '@/engine/scheduler/scheduler';
import type { Pack } from './schema';

/**
 * Installe ou met à jour un pack. Idempotent : le contenu (mots, phrases) est remplacé,
 * la progression (cartes, logs) est conservée ; seules les nouvelles phrases reçoivent une carte neuve.
 */
export async function installPack(db: Db, pack: Pack, now = Date.now()): Promise<void> {
  const lang = pack.meta.lang;
  const sched = createScheduler();
  await db.transaction(async () => {
    await db.run(
      `INSERT INTO packs (lang, pack_version, format_version, name, tts_locale, installed_at)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(lang) DO UPDATE SET pack_version=excluded.pack_version,
         format_version=excluded.format_version, name=excluded.name,
         tts_locale=excluded.tts_locale, installed_at=excluded.installed_at`,
      [lang, pack.packVersion, pack.formatVersion, pack.meta.name, pack.meta.ttsLocale, now],
    );
    await db.run('DELETE FROM words WHERE lang = ?', [lang]);
    await db.run('DELETE FROM sentence_words WHERE lang = ?', [lang]);
    for (const w of pack.words) {
      await db.run(
        'INSERT INTO words (lang,id,lemma,rank,pos,themes,level,gloss) VALUES (?,?,?,?,?,?,?,?)',
        [lang, w.id, w.lemma, w.rank, w.pos ?? null, JSON.stringify(w.themes), w.level, w.gloss],
      );
    }
    for (const s of pack.sentences) {
      await db.run(
        `INSERT INTO sentences (lang,id,text,fr,level,themes,source_id) VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(lang,id) DO UPDATE SET text=excluded.text, fr=excluded.fr,
           level=excluded.level, themes=excluded.themes, source_id=excluded.source_id`,
        [lang, s.id, s.text, s.fr, s.level, JSON.stringify(s.themes), s.sourceId ?? null],
      );
      for (const wid of s.wordIds) {
        await db.run(
          'INSERT OR IGNORE INTO sentence_words (lang,sentence_id,word_id) VALUES (?,?,?)',
          [lang, s.id, wid],
        );
      }
      const c = sched.newCard(now);
      await db.run(
        `INSERT OR IGNORE INTO cards (lang,sentence_id,due,stability,difficulty,elapsed_days,
           scheduled_days,reps,lapses,learning_steps,state,last_review) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          lang,
          s.id,
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
        ],
      );
    }
  });
}
