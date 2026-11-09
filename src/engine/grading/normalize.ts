/** Normalisation de texte pour la correction : indépendante de la langue. */

const APOSTROPHES = /[’‘`´ʼ]/g;
// Tout ce qui n'est ni lettre, ni chiffre, ni espace, ni apostrophe droite.
const PUNCTUATION = /[^\p{L}\p{N}\s']/gu;

/** Minuscules, apostrophes unifiées, ponctuation supprimée, espaces compactés. Accents conservés. */
export function normalize(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(APOSTROPHES, "'")
    .replace(PUNCTUATION, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Supprime les diacritiques (à → a). */
export function stripAccents(input: string): string {
  return input.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
}

/** Découpe en mots ; l'apostrophe reste dans le mot (« l'acqua »). */
export function words(input: string): string[] {
  const n = normalize(input);
  return n === '' ? [] : n.split(' ');
}
