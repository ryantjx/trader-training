/**
 * Put-call parity game (Manual, Math and units).
 *
 * A faithful rebuild of the source artifact:
 *
 *   - 15 questions, one hidden variable, numeric entry, marked to the penny
 *   - the displayed figures are generated so the arithmetic does not collapse to
 *     a round number
 *   - the relationship holds EXACTLY at generation time, so the answer is unique
 *
 * Two constraints the README adds on top of the artifact:
 *
 *   1. No negative option values, and the no-arbitrage bounds must hold:
 *        max(0, S-K) <= C <= S   and   max(0, K-S) <= P <= K
 *      Any draw that violates them is rejected and resampled.
 *   2. Answers are correct to 2dp.
 *
 * Everything is computed in integer cents. That is what makes "exact to the
 * penny" true rather than approximately true, and it means the marked answer is
 * always exactly representable at 2dp — so no floating-point comparison and no
 * cross-engine rounding risk.
 *
 * The artifact's formula, as displayed to the user:
 *     Call = (Stock - Strike) + Put + Rev/Con
 */
import { fromCents } from '../money';
import type { ChoiceOption, Generator, NumericQuestion, Rng } from '../types';

/** Stock price 20 to 150, in cents. */
const S_MIN = 2_000;
const S_MAX = 15_000;
/** Strike within +/- 10 of spot, snapped to 0.50 increments. */
const OFFSET_MAX = 1_000;
const STRIKE_GRID = 50;
/** Rev/Con -2.00 to +2.00, in cents. */
const REVCON_MAX = 200;
/** Time value 0 to 3.00. */
const TV_MAX = 300;

export interface ParityDraw {
  stockCents: number;
  strikeCents: number;
  callCents: number;
  putCents: number;
  revConCents: number;
}

/**
 * Draw a legal price set.
 *
 * The construction is arranged so that legality is structural rather than
 * something to retry until it happens. Writing ci and pi for the call and put
 * intrinsic values, build the legs as
 *
 *     call = ci + tv + r
 *     put  = pi + tv
 *
 * Parity then holds identically, for ANY tv and r:
 *
 *     (S - K) + put + r - call
 *       = (S - K) + pi + tv + r - ci - tv - r
 *       = (S - K) + pi - ci
 *       = 0
 *
 * because (S - K) + max(0, K - S) - max(0, S - K) is zero in both branches.
 *
 * So the only work left is to draw tv and r inside the range where the four
 * bounds hold, which is a short interval with a closed form:
 *
 *     call >= ci   <=>  tv + r >= 0
 *     call <= S    <=>  r <= S - ci - tv
 *     put  <= K    <=>  tv <= K - pi
 *
 * Both tv and r are drawn from those ranges, and between them they are what
 * stops the arithmetic collapsing to round numbers. The source artifact used two
 * separate premium adjustments for the same purpose; that role is served here by
 * the time value and the carry term, while keeping parity exact rather than
 * approximately true.
 */
function draw(rng: Rng): ParityDraw {
  const stockCents = rng.int(S_MIN, S_MAX);
  const rawStrike = stockCents + rng.int(-OFFSET_MAX, OFFSET_MAX);
  const strikeCents = Math.round(rawStrike / STRIKE_GRID) * STRIKE_GRID;

  const callIntrinsic = Math.max(0, stockCents - strikeCents);
  const putIntrinsic = Math.max(0, strikeCents - stockCents);

  // tv upper bound keeps the put inside its no-arbitrage ceiling of the strike.
  const tvCeiling = Math.min(TV_MAX, Math.min(stockCents, strikeCents));
  const timeValueCents = rng.int(0, Math.max(0, tvCeiling));

  // r lower bound keeps the call non-negative; upper bound keeps it at or below spot.
  const rFloor = Math.max(-REVCON_MAX, -timeValueCents);
  const rCeiling = Math.min(REVCON_MAX, stockCents - callIntrinsic - timeValueCents);
  const revConCents = rFloor <= rCeiling ? rng.int(rFloor, rCeiling) : rFloor;

  const callCents = callIntrinsic + timeValueCents + revConCents;
  const putCents = putIntrinsic + timeValueCents;

  return { stockCents, strikeCents, callCents, putCents, revConCents };
}

/**
 * The README's constraints. Returns true only if the draw is a legal set of
 * prices, so the caller can resample.
 */
export function isLegal(d: ParityDraw): boolean {
  const { stockCents: s, strikeCents: k, callCents: c, putCents: p } = d;

  // No negative option values.
  if (c < 0 || p < 0) return false;

  // No-arbitrage bounds, undiscounted in the game's simplified framing.
  if (c < Math.max(0, s - k)) return false; // a call cannot be worth less than intrinsic
  if (c > s) return false; // a call cannot exceed spot
  if (p < Math.max(0, k - s)) return false; // a put cannot be worth less than intrinsic
  if (p > k) return false; // a put cannot exceed the strike

  // Parity must hold exactly, in integer cents.
  const parityCheck = (s - k) + p + d.revConCents - c;
  if (parityCheck !== 0) return false;

  return true;
}

/**
 * Draw a legal set of prices. No rejection loop is needed: the construction in
 * draw() guarantees legality, and isLegal remains as the assertion that it does.
 */
export function drawLegal(rng: Rng): ParityDraw {
  const d = draw(rng);
  // Failing here means the construction in draw() is wrong, not that a rare
  // draw should be retried. Better to fail loudly during testing.
  if (!isLegal(d)) {
    throw new Error(`parity draw is illegal: ${JSON.stringify(d)}`);
  }
  return d;
}

export type HiddenVar = 'call' | 'put' | 'stock' | 'revcon';

export interface ParityQuestion {
  hidden: HiddenVar;
  draw: ParityDraw;
  answerCents: number;
}

/** The four rearrangements of parity, each exact in integer cents. */
export function solve(hidden: HiddenVar, d: ParityDraw): number {
  switch (hidden) {
    case 'call':
      // C = (S - K) + P + Rev/Con
      return d.stockCents - d.strikeCents + d.putCents + d.revConCents;
    case 'put':
      // P = C - (S - K) - Rev/Con
      return d.callCents - (d.stockCents - d.strikeCents) - d.revConCents;
    case 'stock':
      // S = K + C - P - Rev/Con
      return d.strikeCents + d.callCents - d.putCents - d.revConCents;
    case 'revcon':
      // Rev/Con = C - (S - K) - P
      return d.callCents - (d.stockCents - d.strikeCents) - d.putCents;
  }
}

const LABELS: Record<HiddenVar, string> = {
  call: 'Call Value',
  put: 'Put Value',
  stock: 'Stock Price',
  revcon: 'Rev/Con Value',
};

const HIDDEN: readonly HiddenVar[] = ['call', 'put', 'stock', 'revcon'] as const;

function centsFor(d: ParityDraw, which: HiddenVar): number {
  switch (which) {
    case 'call':
      return d.callCents;
    case 'put':
      return d.putCents;
    case 'stock':
      return d.stockCents;
    case 'revcon':
      return d.revConCents;
  }
}

function money(cents: number): string {
  const v = fromCents(cents);
  const sign = v < 0 ? '−' : '';
  return `${sign}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Build the question text with the hidden variable marked as "?". */
export function renderParityPrompt(d: ParityDraw, hidden: HiddenVar): string {
  const parts: string[] = [];
  for (const h of HIDDEN) {
    parts.push(`${LABELS[h]}: ${h === hidden ? '? (this is the answer)' : money(centsFor(d, h))}`);
  }
  parts.push(`Strike Price: ${money(d.strikeCents)}`);
  return parts.join('\n');
}

const EXPLAIN: Record<HiddenVar, string> = {
  call: 'Parity says a call equals intrinsic plus a put plus carry. Rearrange for the call: Call = (Stock − Strike) + Put + Rev/Con.',
  put: 'Parity says a call equals intrinsic plus a put plus carry. Rearrange for the put by moving the other three legs across: Put = Call − (Stock − Strike) − Rev/Con.',
  stock: 'Parity says a call equals intrinsic plus a put plus carry. Rearrange for spot: Stock = Strike + Call − Put − Rev/Con.',
  revcon:
    'Rearrange parity for the carry term: Rev/Con = Call − (Stock − Strike) − Put. A positive value is a conversion; negative is a reversal.',
};

/** The generator used inside the daily set. */
export function generateParity(rng: Rng): NumericQuestion {
  const d = drawLegal(rng);
  const hidden = rng.pick(HIDDEN);
  const answerCents = solve(hidden, d);

  return {
    kind: 'numeric',
    id: `parity-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'put-call-parity',
    category: 'math',
    subgroup: 'put-call-parity',
    prompt: `Find the missing value. Call = (Stock − Strike) + Put + Rev/Con.\n\n${renderParityPrompt(d, hidden)}`,
    context:
      'Rev/Con is the reversal/conversion carry term: the financing and dividend effect of holding the replicating position to expiry. Positive for a conversion, negative for a reversal.',
    explain: EXPLAIN[hidden],
    anchor: 'Parity says a call equals intrinsic plus a put plus carry. If one of the four legs is missing, rearrange rather than rederive.',
    citation: 'Manual, Math and units, put-call parity',
    signature: `parity|hidden-${hidden}`,
    answer: fromCents(answerCents),
    decimals: 2,
    tolerance: 0,
    unit: 'USD',
  };
}

/**
 * A variant that asks which rearrangement applies, to test the structure rather
 * than the arithmetic. Used alongside the numeric variant so the drill tests
 * structure as well as execution.
 */
export function generateParityChoice(rng: Rng): import('../types').ChoiceQuestion {
  const d = drawLegal(rng);
  const hidden = rng.pick(HIDDEN);

  const correct: Record<HiddenVar, string> = {
    call: `(${money(d.stockCents)} − ${money(d.strikeCents)}) + ${money(d.putCents)} + ${money(d.revConCents)}`,
    put: `${money(d.callCents)} − (${money(d.stockCents)} − ${money(d.strikeCents)}) − ${money(d.revConCents)}`,
    stock: `${money(d.strikeCents)} + ${money(d.callCents)} − ${money(d.putCents)} − ${money(d.revConCents)}`,
    revcon: `${money(d.callCents)} − (${money(d.stockCents)} − ${money(d.strikeCents)}) − ${money(d.putCents)}`,
  };

  // Four distractors, each a single plausible sign or bracket error. Sampling
  // three of them (rather than emitting one fixed wrong answer) makes the option
  // set vary between draws, which the structure question previously did not.
  const wrongPool: Record<HiddenVar, string[]> = {
    call: [
      `(${money(d.stockCents)} − ${money(d.strikeCents)}) + ${money(d.putCents)} − ${money(d.revConCents)}`,
      `(${money(d.stockCents)} + ${money(d.strikeCents)}) + ${money(d.putCents)} + ${money(d.revConCents)}`,
      `${money(d.callCents)} − ${money(d.putCents)} + ${money(d.revConCents)}`,
      `(${money(d.strikeCents)} − ${money(d.stockCents)}) + ${money(d.putCents)} + ${money(d.revConCents)}`,
    ],
    put: [
      `${money(d.callCents)} + (${money(d.stockCents)} − ${money(d.strikeCents)}) − ${money(d.revConCents)}`,
      `${money(d.callCents)} − (${money(d.stockCents)} − ${money(d.strikeCents)}) + ${money(d.revConCents)}`,
      `${money(d.callCents)} + (${money(d.stockCents)} − ${money(d.strikeCents)}) + ${money(d.revConCents)}`,
      `(${money(d.stockCents)} − ${money(d.strikeCents)}) − ${money(d.callCents)} − ${money(d.revConCents)}`,
    ],
    stock: [
      `${money(d.strikeCents)} + ${money(d.callCents)} + ${money(d.putCents)} − ${money(d.revConCents)}`,
      `${money(d.strikeCents)} − ${money(d.callCents)} + ${money(d.putCents)} − ${money(d.revConCents)}`,
      `${money(d.strikeCents)} + ${money(d.callCents)} − ${money(d.putCents)} + ${money(d.revConCents)}`,
      `${money(d.callCents)} + ${money(d.putCents)} − ${money(d.revConCents)}`,
    ],
    revcon: [
      `${money(d.callCents)} − (${money(d.stockCents)} + ${money(d.strikeCents)}) − ${money(d.putCents)}`,
      `${money(d.callCents)} + (${money(d.stockCents)} − ${money(d.strikeCents)}) − ${money(d.putCents)}`,
      `${money(d.callCents)} − (${money(d.stockCents)} − ${money(d.strikeCents)}) + ${money(d.putCents)}`,
      `(${money(d.stockCents)} − ${money(d.strikeCents)}) + ${money(d.putCents)} − ${money(d.callCents)}`,
    ],
  };

  const wrong = rng.sample(wrongPool[hidden].filter((w) => w !== correct[hidden]), 3);

  const options: ChoiceOption[] = [
    { id: 'right', label: correct[hidden] },
    ...wrong.map((label, i) => ({
      id: `w${i}`,
      label,
      note: 'Check the sign on the carry term and on the intrinsic.',
    })),
  ];

  return {
    kind: 'choice',
    id: `parity-choice-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'put-call-parity-structure',
    category: 'math',
    subgroup: 'put-call-parity',
    prompt: `Which expression solves for the ${LABELS[hidden].toLowerCase()}?`,
    context: `Call = (Stock − Strike) + Put + Rev/Con. Stock ${money(d.stockCents)}, Strike ${money(d.strikeCents)}, Call ${money(d.callCents)}, Put ${money(d.putCents)}, Rev/Con ${money(d.revConCents)}.`,
    explain: EXPLAIN[hidden],
    anchor: 'Write parity once, then rearrange by moving one term at a time rather than recalling four separate formulas.',
    citation: 'Manual, Math and units',
    signature: `parity|rearrange-${hidden}`,
    options: rng.shuffle(options),
    answerId: 'right',
  };
}

export const parityGenerators: Generator[] = [
  {
    id: 'put-call-parity',
    category: 'math',
    subgroup: 'put-call-parity',
    about: 'Find the missing leg of put-call parity, correct to the penny.',
    generate: generateParity,
  },
  {
    id: 'put-call-parity-structure',
    category: 'math',
    subgroup: 'put-call-parity',
    about: 'Pick the correct rearrangement of parity for a given missing leg.',
    generate: generateParityChoice,
  },
];
