import { stripAccents, words } from './normalize';

export type GradeResult = 'correct' | 'accent' | 'wrong';

export type DiffOp =
  | { type: 'ok'; word: string }
  /** Même mot, accent différent : signalé sans pénalité. */
  | { type: 'accent'; expected: string; actual: string }
  | { type: 'missing'; expected: string }
  | { type: 'extra'; actual: string };

export interface Grade {
  result: GradeResult;
  diff: DiffOp[];
}

/**
 * Compare la réponse à l'attendu (ou à l'une des variantes acceptées).
 * - casse, ponctuation, apostrophes typographiques : ignorées ;
 * - accent manquant/erroné seul : `accent` (jamais pénalisé) ;
 * - sinon `wrong`, avec un diff mot à mot.
 */
export function grade(expected: string | string[], answer: string): Grade {
  const candidates = Array.isArray(expected) ? expected : [expected];
  let best: Grade | null = null;
  for (const c of candidates) {
    const g = gradeOne(c, answer);
    if (g.result === 'correct') return g;
    if (!best || rank(g) < rank(best)) best = g;
  }
  return best ?? { result: 'wrong', diff: [] };
}

function rank(g: Grade): number {
  if (g.result === 'accent') return -1;
  return g.diff.filter((d) => d.type !== 'ok').length;
}

function gradeOne(expected: string, answer: string): Grade {
  const diff = diffWords(words(expected), words(answer));
  const hasError = diff.some((d) => d.type === 'missing' || d.type === 'extra');
  if (hasError) return { result: 'wrong', diff };
  const hasAccent = diff.some((d) => d.type === 'accent');
  return { result: hasAccent ? 'accent' : 'correct', diff };
}

/** LCS sur les mots, en considérant égaux deux mots identiques à l'accent près. */
export function diffWords(exp: string[], act: string[]): DiffOp[] {
  const e = exp.map(stripAccents);
  const a = act.map(stripAccents);
  const n = exp.length;
  const m = act.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = e[i] === a[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (e[i] === a[j]) {
      ops.push(
        exp[i] === act[j]
          ? { type: 'ok', word: exp[i] }
          : { type: 'accent', expected: exp[i], actual: act[j] },
      );
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'missing', expected: exp[i++] });
    } else {
      ops.push({ type: 'extra', actual: act[j++] });
    }
  }
  while (i < n) ops.push({ type: 'missing', expected: exp[i++] });
  while (j < m) ops.push({ type: 'extra', actual: act[j++] });
  return ops;
}
