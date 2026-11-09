import { isDue, createScheduler } from './scheduler';
import { ratingFromGrade } from './rating';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 1, 10);
const s = createScheduler({ fuzz: false });

describe('scheduler (FSRS)', () => {
  it('une carte neuve n’est jamais « due »', () => {
    expect(isDue(s.newCard(T0), T0 + 100 * DAY)).toBe(false);
  });

  it('good sur carte neuve : planifiée dans quelques jours, en révision', () => {
    const c = s.review(s.newCard(T0), 'good', T0);
    expect(c.state).toBe(2);
    expect(c.reps).toBe(1);
    expect(c.due).toBeGreaterThanOrEqual(T0 + DAY);
    expect(isDue(c, T0)).toBe(false);
    expect(isDue(c, c.due)).toBe(true);
  });

  it('easy > good > hard en intervalle', () => {
    const due = (r: 'hard' | 'good' | 'easy') => s.review(s.newCard(T0), r, T0).due;
    expect(due('easy')).toBeGreaterThan(due('good'));
    expect(due('good')).toBeGreaterThanOrEqual(due('hard'));
  });

  it('again après une révision réussie : lapse compté, stabilité réduite', () => {
    const c1 = s.review(s.newCard(T0), 'good', T0);
    const t1 = c1.due;
    const c2 = s.review(c1, 'again', t1);
    expect(c2.lapses).toBe(1);
    expect(c2.stability).toBeLessThan(c1.stability);
    expect(c2.due).toBeLessThanOrEqual(t1 + 2 * DAY);
  });

  it('les intervalles s’allongent quand on réussit à chaque échéance', () => {
    let c = s.review(s.newCard(T0), 'good', T0);
    let prevInterval = c.due - T0;
    for (let i = 0; i < 4; i++) {
      const now = c.due;
      c = s.review(c, 'good', now);
      const interval = c.due - now;
      expect(interval).toBeGreaterThan(prevInterval);
      prevInterval = interval;
    }
  });

  it('retrievability : ~0.9 à l’échéance, plus haute juste après la révision', () => {
    const c = s.review(s.newCard(T0), 'good', T0);
    const atDue = s.retrievability(c, c.due);
    expect(atDue).toBeGreaterThan(0.85);
    expect(atDue).toBeLessThan(0.95);
    expect(s.retrievability(c, T0)).toBeGreaterThan(atDue);
    expect(s.retrievability(s.newCard(T0), T0)).toBe(0);
  });

  it('un état stocké puis rechargé donne le même résultat (aller-retour SQL)', () => {
    const c = s.review(s.newCard(T0), 'good', T0);
    const reloaded = JSON.parse(JSON.stringify(c));
    expect(s.review(reloaded, 'good', c.due)).toEqual(s.review(c, 'good', c.due));
  });
});

describe('ratingFromGrade', () => {
  it('faux → again ; juste → good ; accent → good ; hésitation → hard', () => {
    expect(ratingFromGrade('wrong')).toBe('again');
    expect(ratingFromGrade('correct')).toBe('good');
    expect(ratingFromGrade('accent')).toBe('good');
    expect(ratingFromGrade('correct', { hesitated: true })).toBe('hard');
  });
});
