import type { Db } from './db';

/** Migrations numérotées : l'index + 1 = version du schéma (PRAGMA user_version). Ne jamais modifier une migration publiée. */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

  CREATE TABLE packs (
    lang TEXT PRIMARY KEY, pack_version TEXT NOT NULL, format_version INTEGER NOT NULL,
    name TEXT NOT NULL, tts_locale TEXT NOT NULL, installed_at INTEGER NOT NULL
  );

  CREATE TABLE profiles (
    lang TEXT PRIMARY KEY, goal TEXT, level TEXT, daily_minutes INTEGER,
    placement_done INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
  );

  CREATE TABLE words (
    lang TEXT NOT NULL, id TEXT NOT NULL, lemma TEXT NOT NULL, rank INTEGER NOT NULL,
    pos TEXT, themes TEXT NOT NULL, level TEXT NOT NULL, gloss TEXT NOT NULL,
    PRIMARY KEY (lang, id)
  );

  CREATE TABLE sentences (
    lang TEXT NOT NULL, id TEXT NOT NULL, text TEXT NOT NULL, fr TEXT NOT NULL,
    level TEXT NOT NULL, themes TEXT NOT NULL, source_id TEXT,
    PRIMARY KEY (lang, id)
  );

  CREATE TABLE sentence_words (
    lang TEXT NOT NULL, sentence_id TEXT NOT NULL, word_id TEXT NOT NULL,
    PRIMARY KEY (lang, sentence_id, word_id)
  );
  CREATE INDEX idx_sentence_words_word ON sentence_words (lang, word_id);

  -- Une carte par phrase. state: 0 New, 1 Learning, 2 Review, 3 Relearning.
  CREATE TABLE cards (
    lang TEXT NOT NULL, sentence_id TEXT NOT NULL,
    due INTEGER NOT NULL, stability REAL NOT NULL, difficulty REAL NOT NULL,
    elapsed_days INTEGER NOT NULL, scheduled_days INTEGER NOT NULL,
    reps INTEGER NOT NULL, lapses INTEGER NOT NULL, learning_steps INTEGER NOT NULL,
    state INTEGER NOT NULL, last_review INTEGER,
    suspended INTEGER NOT NULL DEFAULT 0, known_by_placement INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (lang, sentence_id)
  );
  CREATE INDEX idx_cards_due ON cards (lang, state, due);

  -- status: unseen | learning | retained | known_placement
  CREATE TABLE word_status (
    lang TEXT NOT NULL, word_id TEXT NOT NULL, status TEXT NOT NULL, first_seen_at INTEGER,
    PRIMARY KEY (lang, word_id)
  );

  CREATE TABLE review_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, lang TEXT NOT NULL, sentence_id TEXT NOT NULL,
    rating TEXT NOT NULL, exercise_type TEXT NOT NULL, reviewed_at INTEGER NOT NULL,
    duration_ms INTEGER, state_before INTEGER NOT NULL
  );
  CREATE INDEX idx_review_logs_lang ON review_logs (lang, reviewed_at);

  CREATE TABLE daily_stats (
    lang TEXT NOT NULL, date TEXT NOT NULL,
    new_count INTEGER NOT NULL DEFAULT 0, review_count INTEGER NOT NULL DEFAULT 0,
    seconds_spent INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (lang, date)
  );
  `,
];

export async function migrate(db: Db): Promise<void> {
  const row = await db.get<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current > MIGRATIONS.length) {
    throw new Error(
      `La base est plus récente (v${current}) que l’appli (v${MIGRATIONS.length}). Mets l’appli à jour.`,
    );
  }
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.transaction(async () => {
      await db.exec(MIGRATIONS[v]);
      await db.exec(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
