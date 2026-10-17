/**
 * Persistence.
 *
 * Everything lives in localStorage behind this interface. That interface is the
 * only thing that would change if a leaderboard were added later: a remote
 * implementation could be swapped in without touching the game components.
 *
 * All access is guarded on `typeof window`, because these modules are imported
 * during the static build where there is no browser. On the server the store
 * degrades to an in-memory stub that reads empty and discards writes.
 */
import type { AnswerRecord, Category } from './types';
import type { SrsState } from './srs';
import { scoreSession, type SessionScore } from './scoring';

const KEY = 'trader-training/v1';

export interface StoredAnswer {
  questionId: string;
  generatorId: string;
  category: Category;
  signature: string;
  correct: boolean;
  elapsedMs: number;
}

export interface DailyResult {
  dateKey: string;
  completedAt: string;
  score: SessionScore;
  answers: StoredAnswer[];
}

export interface ParityBest {
  score: number;
  total: number;
  elapsedMs: number;
  achievedAt: string;
}

/** A per-game best, for the competitive standalone games. */
export interface GameBest {
  gameId: string;
  correct: number;
  total: number;
  elapsedMs: number;
  achievedAt: string;
}

interface StoreShape {
  daily: DailyResult[];
  srs: SrsState;
  parityBest: ParityBest | null;
  gameBests: GameBest[];
  confidence: Record<string, 'sure' | 'unsure'>;
}

const EMPTY: StoreShape = {
  daily: [],
  srs: {},
  parityBest: null,
  gameBests: [],
  confidence: {},
};

export interface ResultStore {
  /** The stored result for a day, if it has been played. */
  getDaily(dateKey: string): DailyResult | null;
  /** Save a day's result. Overwrites rather than appending, so a replay of the
   * same day does not create a duplicate record. */
  saveDaily(result: DailyResult): void;
  /** Most recent first. */
  recentDaily(limit: number): DailyResult[];
  getSrs(): SrsState;
  saveSrs(state: SrsState): void;
  getParityBest(): ParityBest | null;
  /** Records a best only if it improves on the stored one. Returns whether it did. */
  offerParityBest(candidate: ParityBest): boolean;
  getGameBest(gameId: string): GameBest | null;
  offerGameBest(candidate: GameBest): boolean;
  getConfidence(signature: string): 'sure' | 'unsure' | null;
  setConfidence(signature: string, value: 'sure' | 'unsure'): void;
  /** Wipes all stored progress. */
  clear(): void;
  /** Raw export, for the JSON backup feature. */
  export(): string;
  /** Restores from an export. Returns false if the payload is not valid. */
  import(json: string): boolean;
}

function read(): StoreShape {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      daily: Array.isArray(parsed.daily) ? parsed.daily : [],
      srs: parsed.srs && typeof parsed.srs === 'object' ? parsed.srs : {},
      parityBest: parsed.parityBest ?? null,
      gameBests: Array.isArray(parsed.gameBests) ? parsed.gameBests : [],
      confidence:
        parsed.confidence && typeof parsed.confidence === 'object' ? parsed.confidence : {},
    };
  } catch {
    // A corrupt payload must not break the site; start clean instead.
    return { ...EMPTY };
  }
}

function write(state: StoreShape): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or storage disabled (private mode). Progress is lost, but
    // the drill still works, which is the right failure mode.
  }
}

export function createLocalStore(): ResultStore {
  return {
    getDaily(dateKey) {
      return read().daily.find((d) => d.dateKey === dateKey) ?? null;
    },

    saveDaily(result) {
      const state = read();
      state.daily = [result, ...state.daily.filter((d) => d.dateKey !== result.dateKey)];
      // Keep the history bounded: a year of daily sets is plenty for the stats page.
      state.daily = state.daily.slice(0, 400);
      write(state);
    },

    recentDaily(limit) {
      return read().daily.slice(0, limit);
    },

    getSrs() {
      return read().srs;
    },

    saveSrs(state) {
      const store = read();
      store.srs = state;
      write(store);
    },

    getParityBest() {
      return read().parityBest;
    },

    offerParityBest(candidate) {
      const state = read();
      const current = state.parityBest;
      // Best means: more correct, or the same score in less time.
      const improves =
        !current ||
        candidate.score > current.score ||
        (candidate.score === current.score && candidate.elapsedMs < current.elapsedMs);
      if (improves) {
        state.parityBest = candidate;
        write(state);
      }
      return improves;
    },

    getGameBest(gameId) {
      return read().gameBests.find((b) => b.gameId === gameId) ?? null;
    },

    offerGameBest(candidate) {
      const state = read();
      const current = state.gameBests.find((b) => b.gameId === candidate.gameId);
      const improves =
        !current ||
        candidate.correct > current.correct ||
        (candidate.correct === current.correct && candidate.elapsedMs < current.elapsedMs);
      if (improves) {
        state.gameBests = [
          candidate,
          ...state.gameBests.filter((b) => b.gameId !== candidate.gameId),
        ];
        write(state);
      }
      return improves;
    },

    getConfidence(signature) {
      return read().confidence[signature] ?? null;
    },

    setConfidence(signature, value) {
      const state = read();
      state.confidence[signature] = value;
      write(state);
    },

    clear() {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.removeItem(KEY);
      } catch {
        // Nothing useful to do; see write().
      }
    },

    export() {
      return JSON.stringify(read(), null, 2);
    },

    import(json) {
      try {
        const parsed = JSON.parse(json) as Partial<StoreShape>;
        if (!parsed || typeof parsed !== 'object') return false;
        write({
          daily: Array.isArray(parsed.daily) ? parsed.daily : [],
          srs: parsed.srs && typeof parsed.srs === 'object' ? parsed.srs : {},
          parityBest: parsed.parityBest ?? null,
          gameBests: Array.isArray(parsed.gameBests) ? parsed.gameBests : [],
          confidence:
            parsed.confidence && typeof parsed.confidence === 'object' ? parsed.confidence : {},
        });
        return true;
      } catch {
        return false;
      }
    },
  };
}

/** Convert a marked answers array into the compact form that gets stored. */
export function toStoredAnswers(records: readonly AnswerRecord[]): StoredAnswer[] {
  return records.map((r) => ({
    questionId: r.question.id,
    generatorId: r.question.generatorId,
    category: r.question.category,
    signature: r.question.signature,
    correct: r.correct,
    elapsedMs: r.elapsedMs,
  }));
}

/** Recompute a session score from stored answers, for the history view. */
export function storedScore(answers: readonly StoredAnswer[]): {
  correct: number;
  total: number;
  accuracy: number;
} {
  const total = answers.length;
  const correct = answers.filter((a) => a.correct).length;
  return { correct, total, accuracy: total === 0 ? 0 : Math.round((correct / total) * 100) };
}

export { scoreSession };
