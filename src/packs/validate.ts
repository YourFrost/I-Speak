import { SUPPORTED_FORMAT_VERSION, type Pack } from './schema';

export class PackError extends Error {}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Valide un pack importé (JSON inconnu). Lève PackError avec un message lisible. */
export function validatePack(input: unknown): Pack {
  if (!isObj(input)) throw new PackError('Le pack doit être un objet JSON.');
  const p = input;
  if (typeof p.formatVersion !== 'number') throw new PackError('formatVersion manquant.');
  if (p.formatVersion > SUPPORTED_FORMAT_VERSION) {
    throw new PackError(
      `Pack en format v${p.formatVersion} : cette version de l’appli gère jusqu’à v${SUPPORTED_FORMAT_VERSION}. Mets l’appli à jour.`,
    );
  }
  if (!isStr(p.packVersion)) throw new PackError('packVersion manquant.');
  const meta = p.meta;
  if (!isObj(meta)) throw new PackError('meta manquant.');
  for (const k of ['lang', 'name', 'nativeName', 'ttsLocale', 'script', 'sourceLang']) {
    if (!isStr(meta[k])) throw new PackError(`meta.${k} manquant.`);
  }
  if (!Array.isArray(p.themes) || !Array.isArray(p.words) || !Array.isArray(p.sentences)) {
    throw new PackError('themes, words et sentences doivent être des tableaux.');
  }

  const themeIds = new Set<string>();
  for (const t of p.themes as Record<string, unknown>[]) {
    if (!isObj(t) || !isStr(t.id) || !isStr(t.label)) throw new PackError('Thème invalide.');
    themeIds.add(t.id);
  }

  const wordIds = new Set<string>();
  for (const w of p.words as Record<string, unknown>[]) {
    if (!isObj(w) || !isStr(w.id) || !isStr(w.lemma) || !isStr(w.gloss) || !isStr(w.level)) {
      throw new PackError(`Mot invalide : ${JSON.stringify(w)}`);
    }
    if (typeof w.rank !== 'number' || !Array.isArray(w.themes)) {
      throw new PackError(`Mot ${w.id} : rank/themes invalides.`);
    }
    if (wordIds.has(w.id)) throw new PackError(`Id de mot dupliqué : ${w.id}`);
    wordIds.add(w.id);
    for (const t of w.themes as string[]) {
      if (!themeIds.has(t)) throw new PackError(`Mot ${w.id} : thème inconnu « ${t} ».`);
    }
  }

  const sentenceIds = new Set<string>();
  for (const s of p.sentences as Record<string, unknown>[]) {
    if (!isObj(s) || !isStr(s.id) || !isStr(s.text) || !isStr(s.fr) || !isStr(s.level)) {
      throw new PackError(`Phrase invalide : ${JSON.stringify(s)}`);
    }
    if (!Array.isArray(s.wordIds) || !Array.isArray(s.themes)) {
      throw new PackError(`Phrase ${s.id} : wordIds/themes invalides.`);
    }
    if (sentenceIds.has(s.id)) throw new PackError(`Id de phrase dupliqué : ${s.id}`);
    sentenceIds.add(s.id);
    for (const w of s.wordIds as string[]) {
      if (!wordIds.has(w)) throw new PackError(`Phrase ${s.id} : mot inconnu « ${w} ».`);
    }
    for (const t of s.themes as string[]) {
      if (!themeIds.has(t)) throw new PackError(`Phrase ${s.id} : thème inconnu « ${t} ».`);
    }
  }
  return input as unknown as Pack;
}
