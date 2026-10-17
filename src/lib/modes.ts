/**
 * Time modes and tiers.
 *
 * Learn is untimed, because the first exposure to a new drill should not be
 * rushed. Drill and Desk add a per-question budget, which is what turns a quiz
 * into practice for a real desk: the arithmetic has to be right AND fast. The
 * budget is generous enough that a competent answer fits comfortably, and it
 * never affects the parity game's score, which is accuracy-only by decision.
 */
export type TimeMode = 'learn' | 'drill' | 'desk';

import type { Tier } from './types';

export interface TimeModeSpec {
  id: TimeMode;
  label: string;
  description: string;
  /** Seconds per question, or null for untimed. */
  secondsPerQuestion: number | null;
  /** Default tier for this mode. */
  defaultTier: Tier;
}

export const TIME_MODES: readonly TimeModeSpec[] = [
  {
    id: 'learn',
    label: 'Learn',
    description: 'Untimed. Read the explanation and the anchor without pressure.',
    secondsPerQuestion: null,
    defaultTier: 1,
  },
  {
    id: 'drill',
    label: 'Drill',
    description: '30 seconds a question. Comfortable, but not idle.',
    secondsPerQuestion: 30,
    defaultTier: 2,
  },
  {
    id: 'desk',
    label: 'Desk',
    description: '10 seconds a question. What the floor actually feels like.',
    secondsPerQuestion: 10,
    defaultTier: 3,
  },
];

export function timeMode(id: TimeMode): TimeModeSpec {
  return TIME_MODES.find((m) => m.id === id) ?? (TIME_MODES[0] as TimeModeSpec);
}

export const DRILL_CATEGORIES = [
  { slug: 'math', label: 'Math', description: 'Calculator-free arithmetic: Greeks, FX, basis points, forwards and vol.' },
  { slug: 'markets', label: 'Markets', description: 'Microstructure, ticker recall and market knowledge for HK, JP, SG and AU.' },
  { slug: 'derivatives', label: 'Asia Derivatives', description: 'Listed contracts, OTC exotics and the volatility surface.' },
] as const;
