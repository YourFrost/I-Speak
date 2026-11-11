import type { Db } from '@/db/db';

export interface Candidate {
  sentenceId: string;
  wordIds: string[];
  /** Rang de fréquence de chaque mot (même ordre que wordIds). */
  ranks: number[];
  themes: string[];
}

/**
 * Sélection « i+1 » : on choisit des phrases contenant au plus un mot encore inconnu,
 * en commençant par les mots les plus fréquents. Les mots des phrases choisies deviennent connus
 * pour la suite de la sélection (les phrases d'un même lot se construisent les unes sur les autres).
 * Si rien ne convient (début de pack), on tolère 2 mots inconnus pour ne jamais bloquer.
 */
export function pickNew(
  candidates: Candidate[],
  knownWordIds: Set<string>,
  limit: number,
  preferredThemes: string[] = [],
): string[] {
  const known = new Set(knownWordIds);
  const left = [...candidates];
  const picked: string[] = [];
  const preferred = new Set(preferredThemes);

  const score = (c: Candidate) => {
    const unknownRanks = c.wordIds.flatMap((w, i) => (known.has(w) ? [] : [c.ranks[i]]));
    const themeBonus = c.themes.some((t) => preferred.has(t)) ? 0 : 1;
    return {
      unknown: unknownRanks.length,
      // Priorité : phrases qui introduisent un mot (avant celles 100 % connues), thème, fréquence, brièveté.
      key: [
        unknownRanks.length === 0 ? 1 : 0,
        themeBonus,
        Math.max(0, ...unknownRanks),
        c.wordIds.length,
      ],
    };
  };

  while (picked.length < limit && left.length > 0) {
    let best: Candidate | null = null;
    // Tolérance : 1 mot inconnu ; 2 seulement si rien d'autre (ne jamais bloquer).
    for (const maxUnknown of [1, 2]) {
      const pool = left.map((c) => ({ c, ...score(c) })).filter((x) => x.unknown <= maxUnknown);
      if (pool.length === 0) continue;
      pool.sort((a, b) => {
        for (let i = 0; i < a.key.length; i++)
          if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i];
        return a.c.sentenceId.localeCompare(b.c.sentenceId);
      });
      best = pool[0].c;
      break;
    }
    if (!best) break;
    picked.push(best.sentenceId);
    best.wordIds.forEach((w) => known.add(w));
    left.splice(left.indexOf(best), 1);
  }
  return picked;
}

/** Charge les données depuis la base puis délègue à pickNew. */
export async function pickNewFromDb(
  db: Db,
  lang: string,
  limit: number,
  preferredThemes: string[] = [],
): Promise<string[]> {
  const rows = await db.all<{ sentence_id: string; word_id: string; rank: number; themes: string }>(
    `SELECT sw.sentence_id, sw.word_id, w.rank, s.themes
       FROM cards c
       JOIN sentence_words sw ON sw.lang=c.lang AND sw.sentence_id=c.sentence_id
       JOIN words w ON w.lang=sw.lang AND w.id=sw.word_id
       JOIN sentences s ON s.lang=c.lang AND s.id=c.sentence_id
      WHERE c.lang=? AND c.state=0 AND c.suspended=0 AND c.known_by_placement=0
      ORDER BY sw.sentence_id`,
    [lang],
  );
  const by = new Map<string, Candidate>();
  for (const r of rows) {
    const c = by.get(r.sentence_id) ?? {
      sentenceId: r.sentence_id,
      wordIds: [],
      ranks: [],
      themes: JSON.parse(r.themes) as string[],
    };
    c.wordIds.push(r.word_id);
    c.ranks.push(r.rank);
    by.set(r.sentence_id, c);
  }
  const knownRows = await db.all<{ word_id: string }>(
    `SELECT DISTINCT sw.word_id FROM cards c
       JOIN sentence_words sw ON sw.lang=c.lang AND sw.sentence_id=c.sentence_id
      WHERE c.lang=? AND c.state<>0
     UNION SELECT word_id FROM word_status WHERE lang=? AND status IN ('retained','known_placement')`,
    [lang, lang],
  );
  return pickNew(
    [...by.values()],
    new Set(knownRows.map((r) => r.word_id)),
    limit,
    preferredThemes,
  );
}
