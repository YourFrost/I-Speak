import { createEmptyCard, fsrs, Rating, State, type Card, type Grade as FsrsGrade } from 'ts-fsrs';

/** État de carte tel que stocké en base (dates en millisecondes, rien de propre à une langue). */
export interface CardState {
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  learningSteps: number;
  /** 0 New, 1 Learning, 2 Review, 3 Relearning */
  state: number;
  lastReview: number | null;
}

export type AppRating = 'again' | 'hard' | 'good' | 'easy';

const RATINGS: Record<AppRating, FsrsGrade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export interface SchedulerOptions {
  /** Rétention visée (défaut 0.9). */
  retention?: number;
  /** Désactive le flou aléatoire des intervalles (tests). */
  fuzz?: boolean;
}

/**
 * Une session par jour : pas d'étapes d'apprentissage en minutes ; une carte « Again »
 * est simplement représentée dans la même session par la file de session.
 */
export function createScheduler(opts: SchedulerOptions = {}) {
  const f = fsrs({
    request_retention: opts.retention ?? 0.9,
    enable_fuzz: opts.fuzz ?? true,
    enable_short_term: false,
    learning_steps: [],
    relearning_steps: [],
  });

  return {
    newCard(now: number): CardState {
      return fromFsrs(createEmptyCard(new Date(now)));
    },
    review(card: CardState, rating: AppRating, now: number): CardState {
      return fromFsrs(f.next(toFsrs(card), new Date(now), RATINGS[rating]).card);
    },
    /** Probabilité de se rappeler la carte à l'instant `now` (0..1), 0 pour une carte neuve. */
    retrievability(card: CardState, now: number): number {
      if (card.state === State.New) return 0;
      return f.get_retrievability(toFsrs(card), new Date(now), false);
    },
  };
}

export type Scheduler = ReturnType<typeof createScheduler>;

export function isDue(card: CardState, now: number): boolean {
  return card.state !== State.New && card.due <= now;
}

function toFsrs(c: CardState): Card {
  return {
    due: new Date(c.due),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsedDays,
    scheduled_days: c.scheduledDays,
    reps: c.reps,
    lapses: c.lapses,
    learning_steps: c.learningSteps,
    state: c.state,
    last_review: c.lastReview === null ? undefined : new Date(c.lastReview),
  };
}

function fromFsrs(c: Card): CardState {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsedDays: c.elapsed_days,
    scheduledDays: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    learningSteps: c.learning_steps,
    state: c.state,
    lastReview: c.last_review ? c.last_review.getTime() : null,
  };
}
