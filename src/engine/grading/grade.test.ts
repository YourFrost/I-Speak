import { grade } from './grade';
import { normalize, stripAccents } from './normalize';

describe('normalize', () => {
  it('ignore casse, ponctuation et espaces multiples', () => {
    expect(normalize('  Ciao,   COME stai?! ')).toBe('ciao come stai');
  });
  it('unifie les apostrophes typographiques', () => {
    expect(normalize('L’acqua')).toBe("l'acqua");
  });
  it('stripAccents retire les diacritiques', () => {
    expect(stripAccents('perché è già')).toBe('perche e gia');
  });
});

describe('grade', () => {
  const exp = 'Voglio un caffè, per favore.';
  it('correct malgré casse et ponctuation', () => {
    expect(grade(exp, 'voglio un caffè per favore').result).toBe('correct');
  });
  it('accent manquant : signalé sans pénalité', () => {
    const g = grade(exp, 'Voglio un caffe per favore');
    expect(g.result).toBe('accent');
    expect(g.diff).toContainEqual({ type: 'accent', expected: 'caffè', actual: 'caffe' });
  });
  it('mot manquant et mot en trop sont montrés précisément', () => {
    const g = grade(exp, 'Voglio caffè per piacere favore');
    expect(g.result).toBe('wrong');
    expect(g.diff).toContainEqual({ type: 'missing', expected: 'un' });
    expect(g.diff).toContainEqual({ type: 'extra', actual: 'piacere' });
  });
  it('mot remplacé = manquant + en trop', () => {
    const g = grade('Sono stanco', 'Sono felice');
    expect(g.result).toBe('wrong');
    expect(g.diff).toEqual([
      { type: 'ok', word: 'sono' },
      { type: 'missing', expected: 'stanco' },
      { type: 'extra', actual: 'felice' },
    ]);
  });
  it('accepte plusieurs variantes', () => {
    expect(grade(['Sì', 'Certo'], 'certo!').result).toBe('correct');
  });
  it('réponse vide = faux', () => {
    expect(grade('Ciao', '').result).toBe('wrong');
  });
  it('apostrophe typographique acceptée', () => {
    expect(grade("L'acqua è fredda", 'l’acqua è fredda').result).toBe('correct');
  });
});
