/**
 * Time budget.
 *
 * Fixed, deliberately. An earlier draft documented three selectable modes
 * (Learn, Drill, Desk) plus four difficulty tiers, but no selector was ever
 * built and the homepage hardcoded one setting. Documented-but-absent features
 * are worse than none, so only the real vocabulary is kept:
 *
 *   - the daily set runs at a fixed per-question budget, so a score from one day
 *     is comparable to a score from another;
 *   - the single-quiz drills are untimed, because they exist for working on one
 *     thing rather than for measuring yourself.
 *
 * If a mode selector is ever built, `TIME_MODES` is the seam to widen. It is
 * kept because `DailyChallenge` accepts a mode, which the tests and any future
 * replay need.
 */
export type TimeMode = 'learn' | 'drill' | 'desk';

export interface TimeModeSpec {
  id: TimeMode;
  label: string;
  description: string;
  /** Seconds per question, or null for untimed. */
  secondsPerQuestion: number | null;
}

export const TIME_MODES: readonly TimeModeSpec[] = [
  {
    id: 'learn',
    label: 'Learn',
    description: 'Untimed. Read the explanation and the anchor without pressure.',
    secondsPerQuestion: null,
  },
  {
    id: 'drill',
    label: 'Drill',
    description: '30 seconds a question. Comfortable, but not idle.',
    secondsPerQuestion: 30,
  },
  {
    id: 'desk',
    label: 'Desk',
    description: '10 seconds a question. What the floor actually feels like.',
    secondsPerQuestion: 10,
  },
];

export function timeMode(id: TimeMode): TimeModeSpec {
  return TIME_MODES.find((m) => m.id === id) ?? (TIME_MODES[1] as TimeModeSpec);
}

/**
 * What the daily set actually runs at. These are the values the homepage passes,
 * surfaced so the About page and the manual can state the truth rather than
 * describe a control that does not exist.
 */
export const DAILY_MODE: TimeMode = 'drill';
export const DAILY_SECONDS_PER_QUESTION = 30;
