/**
 * The question model.
 *
 * A question is a discriminated union over its interaction shape, so a renderer
 * can switch exhaustively on `kind` and a marker can do the same. Every question
 * carries the material that turns a quiz into a trainer:
 *
 *   explain  — the method, shown after answering. Not optional.
 *   anchor   — the rule of thumb to memorise, where one exists.
 *   citation — where the fact came from, so it can be checked.
 *
 * `signature` is the spaced-repetition key. It identifies the *concept* being
 * tested (e.g. "gamma-pnl|unit-per-1pct"), not the particular instance, so a
 * concept the trader keeps missing resurfaces even when the numbers change.
 */

/**
 * The three content groups.
 *
 * Everything in the site belongs to exactly one of these, and the grouping is
 * the same in the README, the sidebar and the code. It replaced an earlier
 * five-way split (`mental-math`, `markets`, `derivatives`, `exotics`,
 * `knowledge`) in which "derivatives" and "exotics" were separate groups and
 * "knowledge" had no obvious home. Two consequences of the merge are worth
 * knowing:
 *
 *   - Listed contracts and OTC exotics now share the `derivatives` group. The
 *     distinction is preserved by each generator's `subgroup` (see below),
 *     because it is the distinction the desk actually cares about.
 *   - The old `knowledge` category was genuinely mixed. Calendars, access and
 *     central banks are market content; the volatility surface is derivatives
 *     content. It was split rather than relabelled.
 */
export type Category = 'math' | 'markets' | 'derivatives';

export type { Rng } from './rng';
import type { Rng } from './rng';

/** In display order. Also the order the daily set and the sidebar use. */
export const CATEGORIES: readonly Category[] = ['math', 'markets', 'derivatives'] as const;

export const CATEGORY_LABELS: Record<Category, string> = {
  math: 'Math',
  markets: 'Markets',
  derivatives: 'Asia Derivatives',
};

/** One-line description of what each group is for. */
export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  math: 'Calculator-free arithmetic: Greeks, FX, basis points, forwards and vol.',
  markets: 'Microstructure, ticker recall and market knowledge for HK, JP, SG and AU.',
  derivatives: 'Listed contracts and the OTC exotics sold on top of them.',
};

/**
 * Optional sub-grouping within a group.
 *
 * Only `derivatives` uses this, to keep listed and exotic content apart in the
 * UI now that they share a group. Undefined means the generator has no
 * sub-classification.
 */
export type Subgroup = 'listed' | 'exotic' | 'vol-surface';

export const SUBGROUP_LABELS: Record<Subgroup, string> = {
  listed: 'Listed derivatives',
  exotic: 'Exotic options',
  'vol-surface': 'Volatility surface',
};

/** Graduate, junior, VP, MD. Higher tiers get harder generators and less time. */
export type Tier = 1 | 2 | 3 | 4;

export const TIER_LABELS: Record<Tier, string> = {
  1: 'Graduate',
  2: 'Junior',
  3: 'VP',
  4: 'MD',
};

export interface QuestionBase {
  /** Stable within a generated set, used as a React key. */
  id: string;
  generatorId: string;
  category: Category;
  tier: Tier;
  /**
   * Optional sub-grouping inside a category. Only the derivatives group uses it,
   * to keep listed contracts, OTC exotics and vol-surface content apart now that
   * they share a group.
   */
  subgroup?: Subgroup;
  /** The question text. May contain the data the trader needs. */
  prompt: string;
  /** Additional context shown beneath the prompt, e.g. a rate table. */
  context?: string;
  /** The method. Always present. */
  explain: string;
  /** A rule of thumb worth memorising. */
  anchor?: string;
  /** Provenance for the underlying fact. */
  citation?: string;
  /** Spaced-repetition key, at the level of the concept. */
  signature: string;
}

export interface NumericQuestion extends QuestionBase {
  kind: 'numeric';
  answer: number;
  /** How many decimal places the answer is displayed and marked at. */
  decimals: number;
  /** Absolute tolerance. Zero means an exact match at `decimals`. */
  tolerance: number;
  unit?: string;
  /** Optional hint shown in the input, e.g. "in USD". */
  placeholder?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  /** Shown after answering, for wrong options that are instructive. */
  note?: string;
}

export interface ChoiceQuestion extends QuestionBase {
  kind: 'choice';
  options: ChoiceOption[];
  answerId: string;
}

export interface OrderingItem {
  id: string;
  label: string;
}

export interface OrderingQuestion extends QuestionBase {
  kind: 'ordering';
  items: OrderingItem[];
  /** Correct order, as item ids. */
  answerOrder: string[];
}

export type Question = NumericQuestion | ChoiceQuestion | OrderingQuestion;

/** What the trader submitted. */
export type Response =
  | { kind: 'numeric'; value: number | null }
  | { kind: 'choice'; optionId: string | null }
  | { kind: 'ordering'; order: string[] };

export interface AnswerRecord {
  question: Question;
  response: Response;
  correct: boolean;
  elapsedMs: number;
}

/** A generator is a pure function of an Rng and a tier. */
export interface Generator {
  id: string;
  category: Category;
  tier: Tier;
  /** Sub-grouping inside the category, where one applies. */
  subgroup?: Subgroup;
  /**
   * One-line description, used on the drill pages so the trader knows what the
   * generator tests before starting.
   */
  about: string;
  generate(rng: Rng, tier: Tier): Question;
}
