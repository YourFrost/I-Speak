/** Format de pack (indépendant de la langue). Voir le plan : formatVersion + packVersion. */
export const SUPPORTED_FORMAT_VERSION = 1;

export interface PackMeta {
  lang: string;
  name: string;
  nativeName: string;
  /** Locale de synthèse vocale, ex. « it-IT ». */
  ttsLocale: string;
  script: string;
  sourceLang: string;
  attributions?: { source: string; license: string; url?: string }[];
}

export interface PackTheme {
  id: string;
  label: string;
}

export interface PackWord {
  id: string;
  lemma: string;
  rank: number;
  pos?: string;
  themes: string[];
  level: string;
  gloss: string;
}

export interface PackSentence {
  id: string;
  text: string;
  fr: string;
  wordIds: string[];
  level: string;
  themes: string[];
  sourceId?: string;
}

export interface Pack {
  formatVersion: number;
  packVersion: string;
  meta: PackMeta;
  themes: PackTheme[];
  words: PackWord[];
  sentences: PackSentence[];
  grammarNotes?: { id: string; title: string; body: string; sentenceIds?: string[] }[];
  falseFriends?: { id: string; target: string; pitfallFr: string; sentenceIds?: string[] }[];
  lessons?: unknown[];
  listening?: unknown[];
  /** Modules optionnels (ex. alphabet) : ignorés par le moteur v1 mais conservés. */
  modules?: Record<string, unknown>;
}
