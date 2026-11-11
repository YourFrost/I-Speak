import { pickNew, type Candidate } from './pickNew';

const c = (id: string, words: [string, number][], themes: string[] = []): Candidate => ({
  sentenceId: id,
  wordIds: words.map((w) => w[0]),
  ranks: words.map((w) => w[1]),
  themes,
});

describe('pickNew (i+1)', () => {
  const cands = [
    c('s1', [['a', 1]]),
    c('s2', [
      ['a', 1],
      ['b', 2],
    ]),
    c('s3', [
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ]),
    c('s4', [['d', 50]]),
  ];
  it('construit chaque phrase sur les mots des précédentes, par fréquence', () => {
    expect(pickNew(cands, new Set(), 3)).toEqual(['s1', 's2', 's3']);
  });
  it('respecte la limite', () => {
    expect(pickNew(cands, new Set(), 1)).toEqual(['s1']);
  });
  it('ne propose pas une phrase avec trop de mots inconnus tant que possible', () => {
    expect(pickNew([cands[2], cands[3]], new Set(), 1)).toEqual(['s4']);
  });
  it('privilégie les thèmes de l’objectif à difficulté comparable', () => {
    const t = [c('x', [['m', 5]], ['voyage']), c('y', [['n', 4]], ['travail'])];
    expect(pickNew(t, new Set(), 1, ['voyage'])).toEqual(['x']);
  });
  it('ne bloque pas si seules des phrases à 2 mots inconnus restent', () => {
    expect(
      pickNew(
        [
          c('z', [
            ['p', 1],
            ['q', 2],
          ]),
        ],
        new Set(),
        1,
      ),
    ).toEqual(['z']);
  });
  it('une phrase 100 % connue ne passe qu’après celles qui introduisent un mot', () => {
    const t = [
      c('known', [['a', 1]]),
      c('intro', [
        ['a', 1],
        ['b', 9],
      ]),
    ];
    expect(pickNew(t, new Set(['a']), 2)).toEqual(['intro', 'known']);
  });
  it('rien de proposé sans candidat', () => {
    expect(pickNew([], new Set(['a']), 5)).toEqual([]);
  });
});
