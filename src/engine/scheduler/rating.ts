import type { GradeResult } from '../grading/grade';
import type { AppRating } from './scheduler';

/**
 * Traduit le résultat d'un exercice écrit en note FSRS.
 * - juste (accent manquant inclus) → good ; faux → again.
 * - `hesitated` (indice utilisé, réponse lente) rétrograde en hard.
 */
export function ratingFromGrade(
  result: GradeResult,
  opts: { hesitated?: boolean } = {},
): AppRating {
  if (result === 'wrong') return 'again';
  return opts.hesitated ? 'hard' : 'good';
}
