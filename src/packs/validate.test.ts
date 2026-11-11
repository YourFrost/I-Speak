import { PackError, validatePack } from './validate';

const base = () => ({
  formatVersion: 1,
  packVersion: '0.0.1',
  meta: {
    lang: 'xx',
    name: 'Test',
    nativeName: 'Test',
    ttsLocale: 'xx-XX',
    script: 'latin',
    sourceLang: 'fr',
  },
  themes: [{ id: 'base', label: 'Base' }],
  words: [{ id: 'w1', lemma: 'ciao', rank: 1, themes: ['base'], level: 'A1', gloss: 'salut' }],
  sentences: [
    { id: 's1', text: 'Ciao!', fr: 'Salut !', wordIds: ['w1'], level: 'A1', themes: ['base'] },
  ],
});

describe('validatePack', () => {
  it('accepte un pack valide et conserve les modules inconnus', () => {
    const p = { ...base(), modules: { alphabet: { letters: [] } } };
    expect(validatePack(p).modules).toEqual({ alphabet: { letters: [] } });
  });
  it('refuse un formatVersion trop récent', () => {
    expect(() => validatePack({ ...base(), formatVersion: 99 })).toThrow(/Mets l’appli à jour/);
  });
  it('refuse les ids dupliqués', () => {
    const p = base();
    p.words.push({ ...p.words[0] });
    expect(() => validatePack(p)).toThrow(PackError);
  });
  it('refuse un mot inconnu dans une phrase', () => {
    const p = base();
    p.sentences[0].wordIds = ['nope'];
    expect(() => validatePack(p)).toThrow(/mot inconnu/);
  });
  it('refuse un thème inconnu', () => {
    const p = base();
    p.words[0].themes = ['zzz'];
    expect(() => validatePack(p)).toThrow(/thème inconnu/);
  });
  it('refuse une entrée non objet', () => {
    expect(() => validatePack(null)).toThrow(PackError);
  });
});
