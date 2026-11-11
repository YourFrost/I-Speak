import { grade, type Grade } from '../grading/grade';
import { ratingFromGrade } from '../scheduler/rating';
import type { AppRating } from '../scheduler/scheduler';

export interface SentenceData {
  id: string;
  text: string;
  fr: string;
}

/** Traduction français → langue cible, au clavier (rappel actif). */
export interface TranslateExercise {
  type: 'translate';
  sentenceId: string;
  prompt: string;
  answer: string;
}

export function buildTranslate(s: SentenceData): TranslateExercise {
  return { type: 'translate', sentenceId: s.id, prompt: s.fr, answer: s.text };
}

export function gradeTranslate(
  ex: TranslateExercise,
  input: string,
  opts: { hesitated?: boolean } = {},
): { grade: Grade; rating: AppRating } {
  const g = grade(ex.answer, input);
  return { grade: g, rating: ratingFromGrade(g.result, opts) };
}
