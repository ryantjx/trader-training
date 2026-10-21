/**
 * Market microstructure (Manual, Markets and microstructure), driven by sessions.json.
 *
 * Session times are read from data rather than hard-coded, so the quiz and the
 * market reference pages cannot disagree. The ASX entry in sessions.json carries
 * an explicit "unverified" caveat, and questions derived from an entry with a
 * dstNote are excluded from the question pool, so a caveated venue cannot
 * produce a session-time answer that is wrong for half the year.
 */
import sessionsData from '../../data/sessions.json';
import { roundTo } from '../money';
import type {
  ChoiceOption,
  ChoiceQuestion,
  Generator,
  NumericQuestion,
  OrderingQuestion,
  Rng,
} from '../types';

interface Venue {
  id: string;
  name: string;
  market: string;
  currency: string;
  continuousSgt: { open: string; close: string }[];
  lunchSgt: { open: string; close: string }[];
  marketCloseSgt: string;
  settlement: string;
  clearingHouse: string;
  depository: string;
  scripless: boolean;
  stampDuty: string;
  dstNote: string | null;
}

const VENUES = sessionsData.venues as Venue[];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function fmt(hhmm: string): string {
  return hhmm;
}

/** Is the venue in continuous trading at a given SGT time? */
function isOpen(venue: Venue, hhmm: string): boolean {
  const t = toMinutes(hhmm);
  return venue.continuousSgt.some((s) => t >= toMinutes(s.open) && t < toMinutes(s.close));
}

function openAtTime(rng: Rng): ChoiceQuestion {
  // Only ask about venues without a daylight-saving caveat, so the answer is
  // unambiguous year-round.
  const eligible = VENUES.filter((v) => !v.dstNote || !v.dstNote.includes('UNVERIFIED'));
  const target = rng.pick(eligible);

  // Pick a time inside one session, and one time outside all of them.
  const session = rng.pick(target.continuousSgt);
  const openMin = toMinutes(session.open);
  const closeMin = toMinutes(session.close);
  const insideMin = rng.int(openMin + 5, closeMin - 5);
  const inside = `${String(Math.floor(insideMin / 60)).padStart(2, '0')}:${String(insideMin % 60).padStart(2, '0')}`;

  // Outside: late evening SGT, comfortably after every close.
  const outside = rng.pick(['19:00', '20:30', '22:00', '23:30', '05:00'] as const);

  const askOpen = rng.bool();
  const time = askOpen ? inside : outside;
  const answerIsOpen = isOpen(target, time);

  const options: ChoiceOption[] = [
    { id: 'open', label: 'Open' },
    { id: 'closed', label: 'Closed' },
  ];

  const sessionText = target.continuousSgt.map((s) => `${fmt(s.open)}-${fmt(s.close)}`).join(' and ');
  const lunchText = target.lunchSgt.map((s) => `${fmt(s.open)}-${fmt(s.close)}`).join(', ');

  return {
    kind: 'choice',
    id: `micro-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'session-open-at-time',
    category: 'markets',
    subgroup: 'microstructure',
    prompt: `At ${time} SGT, is ${target.name} in continuous trading?`,
    context: `${target.name} continuous session is ${sessionText} SGT${lunchText ? `, with a lunch break ${lunchText}` : ''}.`,
    explain: `${target.name} trades ${sessionText} SGT, so ${time} SGT is ${answerIsOpen ? 'inside' : 'outside'} the session. On the continuous session the order is: JPX opens 08:00 and closes 14:30; SGX opens 09:00 and closes 17:00; HKEX opens 09:30 and closes 16:00. Those are continuous-session closes, before any closing auction.`,
    anchor: 'JPX opens first and closes first. SGX closes last. HKEX sits between the two on both ends.',
    citation: 'Manual, Markets and microstructure; src/content/asia-market-structure.md, cross-venue session table.',
    signature: `markets|session-${target.id}`,
    options,
    answerId: answerIsOpen ? 'open' : 'closed',
    // Note: options order is fixed here rather than shuffled, because Open/Closed
    // is a two-way toggle and shuffling it would make the game feel arbitrary.
  };
}

function clearingHouse(rng: Rng): ChoiceQuestion {
  const target = rng.pick(VENUES);
  {
    // Alternate the question between clearing, depository and margin structure,
    // so the drill tests more than one row of the reference table per venue.
    const angle = rng.pick(['clearing', 'depository', 'margin'] as const);

    if (angle === 'depository') {
      const optionPool = Array.from(new Set(VENUES.map((v) => v.depository)));
      const others = rng.sample(optionPool.filter((d) => d !== target.depository), 3);
      return {
        kind: 'choice',
        id: `micro-${rng.int(0, 1_000_000).toString(36)}`,
        generatorId: 'clearing-house',
        category: 'markets',
        subgroup: 'microstructure',
        prompt: `Which depository holds ${target.name} securities?`,
        context: 'Each market separates the trading venue, the clearing house or CCP, and the depository.',
        explain: `${target.name} settles through ${target.depository}, with ${target.clearingHouse} clearing. ${target.scripless ? 'The market is scripless: holdings are book-entry only.' : 'Physical certificates are still permitted, which affects settlement mechanics.'}`,
        anchor: 'Venue, clearing house, depository: three separate institutions in most Asian markets, not one.',
        citation: 'Manual, Markets and microstructure; src/content/asia-market-structure.md.',
        signature: `markets|depository-${target.id}`,
        options: rng.shuffle([
          { id: 'right', label: target.depository },
          ...others.map((o, i) => ({ id: `w${i}`, label: o })),
        ]),
        answerId: 'right',
      };
    }

    if (angle === 'margin') {
      const correct =
        target.id === 'jpx'
          ? 'Single CCP, so cash and derivatives cross-margin'
          : target.id === 'sgx'
            ? 'Split clearing, so cash and derivatives do not cross-margin'
            : 'Separate clearing entities, so cross-margin is limited';

      // Filter the option pool against the correct label, so a venue whose
      // answer is one of the fixed distractors cannot get two identical options.
      const marginPool = [
        'Single CCP, so cash and derivatives cross-margin',
        'Split clearing, so cash and derivatives do not cross-margin',
        'No clearing house: bilateral margin only',
        'Cross-margin available only for cash, not derivatives',
      ].filter((label) => label !== correct);

      return {
        kind: 'choice',
        id: `micro-${rng.int(0, 1_000_000).toString(36)}`,
        generatorId: 'clearing-house',
        category: 'markets',
        subgroup: 'microstructure',
        prompt: `How does a cash-plus-futures hedge margin at ${target.name}?`,
        context: 'Cross-margin decides whether a hedged book funds in one pool or two.',
        explain: `${target.name} clears through ${target.clearingHouse}. ${
          target.id === 'jpx'
            ? 'JSCC is a single CCP for both cash and derivatives, so the two legs net in one pool.'
            : target.id === 'sgx'
              ? 'CDP clears cash and SGX-DC clears derivatives, with no cross-margin between them, so the hedge funds twice.'
              : 'The cash and derivative legs clear in separate entities, so cross-margin relief is limited or unavailable.'
        }`,
        anchor: 'JPX is the single-CCP venue. SGX is the split one: cash and derivatives in separate pools, no cross-margin.',
        citation: 'Manual, Markets and microstructure; src/content/asia-market-structure.md, operations.',
        signature: `markets|margin-${target.id}`,
        options: rng.shuffle([
          { id: 'right', label: correct },
          ...rng.sample(marginPool, 3).map((label, i) => ({ id: `w${i}`, label })),
        ]),
        answerId: 'right',
      };
    }

    const optionPool = Array.from(new Set(VENUES.map((v) => v.clearingHouse)));
    const others = rng.sample(optionPool.filter((c) => c !== target.clearingHouse), 3);
    return {
      kind: 'choice',
      id: `micro-${rng.int(0, 1_000_000).toString(36)}`,
      generatorId: 'clearing-house',
      category: 'markets',
      subgroup: 'microstructure',
      prompt: `Which body clears ${target.name} trades?`,
      context: 'Each market separates the trading venue, the clearing house or CCP, and the depository.',
      explain: `${target.name} clears through ${target.clearingHouse}, with ${target.depository} as depository. Note SGX is split: CDP clears cash and SGX-DC clears derivatives, with no cross-margin. JPX is the opposite: one CCP, JSCC, for both.`,
      anchor: 'JPX cross-margins because JSCC is a single CCP. SGX does not, because cash and derivatives clear in separate pools.',
      citation: 'Manual, Markets and microstructure; src/content/asia-market-structure.md.',
      signature: `markets|clearing-${target.id}`,
      options: rng.shuffle([
        { id: 'right', label: target.clearingHouse },
        ...others.map((o, i) => ({ id: `w${i}`, label: o })),
      ]),
      answerId: 'right',
    };
  }
}

function stampDuty(rng: Rng): ChoiceQuestion {
  const target = rng.pick(VENUES);
  // Options come from a distinct pool, with the correct label filtered out. The
  // previous fixed list contained "0.1% per side", which is a substring of the
  // correct HKEX answer and made the one duty-bearing venue ambiguous.
  const pool = [
    'None on exchange trades',
    '0.1% per side on stock trades',
    '0.2% per side, on physical transfers only',
    '0.3% per side on stock trades',
  ].filter((label) => label !== target.stampDuty);

  // Two angles on the same cost fact: the venue's own position, and the cost of
  // a round trip expressed in basis points. Both resolve to the same rule.
  const angle = rng.pick(['position', 'round-trip'] as const);
  const isDutyFree = target.stampDuty.startsWith('none');
  const roundTripCorrect = isDutyFree
    ? `${target.name} charges nothing on exchange trades; the cost is brokerage, clearing and the spread`
    : `${target.name} charges ${target.stampDuty}, so a round trip costs 0.2% in duty alone`;

  return {
    kind: 'choice',
    id: `micro-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'stamp-duty',
    category: 'markets',
    subgroup: 'microstructure',
    prompt:
      angle === 'position'
        ? `What is the stamp-duty position on an exchange trade in ${target.name}?`
        : `You round-trip a stock position in ${target.name}. What does the transaction levy cost?`,
    context: 'Stamp duty is a per-side transaction levy on stock trades, and it is the single largest cost difference between these markets.',
    explain: `${target.name}: ${target.stampDuty}. HKEX is the expensive market at 0.1% per side, which alone is a material cost for a delta-hedging book. SGX and JPX are stamp-duty-free on exchange trades.`,
    anchor: 'Hong Kong is the only one of the four that charges stamp duty on exchange trades, at 0.1% per side.',
    citation: 'Manual, Markets and microstructure; GovHK stamp duty rates referenced in src/content/asia-market-structure.md.',
    signature: `markets|stamp-duty-${angle}-${target.id}`,
    options: rng.shuffle([
      {
        id: 'right',
        label: angle === 'position' ? target.stampDuty : roundTripCorrect,
      },
      ...(angle === 'position'
        ? rng.sample(pool, 3).map((label, i) => ({ id: `w${i}`, label }))
        : [
            { id: 'w0', label: 'The levy is charged once, on the buy side only' },
            { id: 'w1', label: 'The levy depends only on the size of the position, not on the market' },
            { id: 'w2', label: 'The levy is refunded on settlement, so a round trip is free' },
          ]),
    ]),
    answerId: 'right',
  };
}

/** The closing routines of the three venues with distinct auction structures. */
function closingRoutine(rng: Rng): OrderingQuestion {
  const routines: {
    id: string;
    prompt: string;
    context: string;
    items: { id: string; label: string }[];
    answerOrder: string[];
    explain: string;
    anchor: string;
  }[] = [
    {
      id: 'sgx',
      prompt: 'Put the phases of the SGX closing routine in order.',
      context: 'SGX closes later than HKEX and JPX, so this window is often the only one still open in the region.',
      items: [
        { id: 'pre', label: 'Pre-close phase opens, 17:00 — orders may be entered, modified and cancelled, but nothing matches' },
        { id: 'rand', label: 'Pre-close phase ends at a random point within 17:04-17:05' },
        { id: 'nocancel', label: 'Non-cancel phase, 17:04-17:05 to 17:06 — no entry, modification or cancellation' },
        { id: 'auction', label: 'Closing auction at 17:06 — the closing price is computed and matched' },
        { id: 'tac', label: 'Trade at Close, 17:06 to 17:16 — trade at the fixed closing price' },
        { id: 'close', label: 'Market close at 17:16' },
      ],
      answerOrder: ['pre', 'rand', 'nocancel', 'auction', 'tac', 'close'],
      explain:
        'Order: pre-close opens at 17:00; it ends at a random point in 17:04-17:05; then the non-cancel phase to 17:06; the closing auction computes and matches the price at 17:06; Trade at Close runs 17:06-17:16; market close is 17:16.',
      anchor: 'Pre-close, then non-cancel, then auction, then Trade at Close. The random end exists so the closing price cannot be gamed.',
    },
    {
      id: 'hkex',
      prompt: 'Put the phases of the HKEX close in order.',
      context: 'Hong Kong closes with a single Closing Auction Session rather than the three-phase routine SGX runs.',
      items: [
        { id: 'cont', label: 'Continuous trading ends at 16:00' },
        { id: 'cas-open', label: 'Closing Auction Session opens, 16:00 — orders may be entered' },
        { id: 'cas-nocancel', label: 'Order input closes; no further changes are accepted' },
        { id: 'cas-match', label: 'Closing price is determined by the auction and matched' },
        { id: 'close', label: 'Market close after the CAS completes, around 16:10' },
      ],
      answerOrder: ['cont', 'cas-open', 'cas-nocancel', 'cas-match', 'close'],
      explain:
        'The continuous session ends at 16:00, the Closing Auction Session opens, order input closes, the auction determines the closing price, and the market closes after the CAS completes around 16:10.',
      anchor: 'HKEX is one auction, not three phases. The CAS determines the close and there is no Trade at Close window.',
    },
    {
      id: 'jpx',
      prompt: 'Put the phases of the Japanese close in order.',
      context: 'Japan uses a single Itayose auction at the close, and the afternoon session ends earlier in SGT terms than either Hong Kong or Singapore.',
      items: [
        { id: 'afternoon', label: 'Afternoon session runs 12:30-15:30 JST (11:30-14:30 SGT)' },
        { id: 'nocont', label: 'Continuous trading stops at 15:30 JST' },
        { id: 'itayose', label: 'Itayose auction determines the closing price' },
        { id: 'close', label: 'Market close at 14:30 SGT' },
      ],
      answerOrder: ['afternoon', 'nocont', 'itayose', 'close'],
      explain:
        'The afternoon session runs to 15:30 JST, continuous trading stops, and a single Itayose auction sets the closing price at 14:30 SGT. There is no Trade at Close and no random-end phase.',
      anchor: 'Japan closes on one Itayose auction. It is the first market to close in the region and has no post-auction window.',
    },
    {
      id: 'sgx-open',
      prompt: 'Put the phases of the SGX opening routine in order.',
      context: 'SGX runs the same three-phase structure at the open as at the close, and the pre-open ends at a random time.',
      items: [
        { id: 'preopen', label: 'Pre-open phase opens at 08:30 — orders may be entered, modified and cancelled, nothing matches' },
        { id: 'rand', label: 'Pre-open ends at a random point within 08:58-08:59' },
        { id: 'nocancel', label: 'Non-cancel phase to 09:00 — no entry, modification or cancellation' },
        { id: 'auction', label: 'Opening auction at 09:00 matches at the computed price' },
        { id: 'cont', label: 'Continuous trading begins; unmatched orders carry forward' },
      ],
      answerOrder: ['preopen', 'rand', 'nocancel', 'auction', 'cont'],
      explain:
        'Pre-open opens at 08:30, ends at a random point within 08:58-08:59, the non-cancel phase runs to 09:00, the opening auction matches at the computed price, and continuous trading begins with unmatched orders carried forward.',
      anchor: 'SGX uses the same pre-open, non-cancel, auction structure at the open as at the close. The random end is the anti-gaming mechanism.',
    },
    {
      id: 'sgx-midday',
      prompt: 'Put the phases of the SGX mid-day break in order.',
      context: 'SGX has a mid-day auction rather than a plain halt, so orders resting before the break continue to rest through it.',
      items: [
        { id: 'morning-end', label: 'Morning session ends at 12:00' },
        { id: 'preopen', label: 'Pre-open phase for the mid-day break opens at 12:00' },
        { id: 'rand', label: 'Pre-open ends at a random point within 12:58-12:59' },
        { id: 'nocancel', label: 'Non-cancel phase to 13:00' },
        { id: 'auction', label: 'Mid-day auction at 13:00 matches at the computed price' },
        { id: 'cont', label: 'Afternoon session begins' },
      ],
      answerOrder: ['morning-end', 'preopen', 'rand', 'nocancel', 'auction', 'cont'],
      explain:
        'The morning session ends at 12:00, the mid-day pre-open runs from 12:00 to a random point in 12:58-12:59, the non-cancel phase runs to 13:00, the mid-day auction matches, and the afternoon session begins.',
      anchor: 'SGX has three auctions, not one. The mid-day auction is why a resting order survives the lunch break.',
    },
  ];

  const routine = rng.pick(routines);

  return {
    kind: 'ordering',
    id: `micro-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'sgx-closing-routine',
    category: 'markets',
    subgroup: 'microstructure',
    prompt: routine.prompt,
    context: routine.context,
    explain: routine.explain,
    anchor: routine.anchor,
    citation: 'Manual, Markets and microstructure; src/content/asia-market-structure.md, trading phases.',
    signature: `markets|closing-routine-${routine.id}`,
    items: rng.shuffle(routine.items),
    answerOrder: [...routine.answerOrder],
  };
}

/**
 * All-in round-trip cost, in basis points.
 *
 * This is the arithmetic a desk actually does before a hedge: brokerage plus
 * clearing plus the levy plus the spread, divided by notional. It makes the
 * microstructure quiz drill a number rather than only recall labels, and it
 * forces the trader to hold the HK stamp duty (0.1% per side, so 20bp a round
 * trip) separately from the small fees.
 */
function roundTripCost(rng: Rng): NumericQuestion {
  // Per-venue cost components, in basis points per side. Fees are approximations
  // in the right order of magnitude; the levy is the exact published rate.
  const venues = [
    { name: 'SGX', brokerageBp: 2.0, clearingBp: 0.3, levyBp: 0, spreadBp: 3.0 },
    { name: 'HKEX', brokerageBp: 2.0, clearingBp: 0.5, levyBp: 10, spreadBp: 4.0 },
    { name: 'JPX', brokerageBp: 1.5, clearingBp: 0.3, levyBp: 0, spreadBp: 2.5 },
    { name: 'ASX', brokerageBp: 2.5, clearingBp: 0.4, levyBp: 0, spreadBp: 3.5 },
  ] as const;

  const venue = rng.pick(venues);
  // Brokerage schedules are size-dependent in practice, so the drill varies the
  // tier rather than repeating one cost figure per venue.
  const size = rng.pick(['small', 'mid', 'large'] as const);
  const brokerageAdjust = size === 'large' ? -0.5 : size === 'small' ? 1.0 : 0;

  // A round trip pays the per-side cost twice, including the levy where it applies.
  const brokerage = roundTo(venue.brokerageBp + brokerageAdjust, 2);
  const perSide = brokerage + venue.clearingBp + venue.levyBp + venue.spreadBp / 2;
  const answer = roundTo(perSide * 2, 1);

  return {
    kind: 'numeric',
    id: `micro-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'round-trip-cost',
    category: 'markets',
    subgroup: 'microstructure',
    prompt: `You buy and sell the same stock in ${venue.name} on the same day on a ${size} ticket, so the brokerage tier applies. Brokerage is ${brokerage}bp per side, clearing ${venue.clearingBp}bp per side, the bid-ask spread is ${venue.spreadBp}bp, and any transaction levy is ${venue.levyBp}bp per side. What is the all-in round-trip cost, in basis points to 1 decimal place?`,
    context: 'A round trip crosses the spread once and pays the per-side fees and levies twice.',
    explain: `Per side: brokerage ${brokerage} + clearing ${venue.clearingBp} + levy ${venue.levyBp} + half the spread ${(venue.spreadBp / 2).toFixed(1)} = ${perSide.toFixed(2)}bp. A round trip pays that twice, so ${answer.toFixed(1)}bp.${venue.levyBp > 0 ? ` The levy is ${venue.levyBp}bp of the ${perSide.toFixed(2)}bp per side, which is why Hong Kong is the expensive market to hedge in cash.` : ' There is no stamp duty here, so the cost is fees plus the spread.'}`,
    anchor: 'Fees are paid per side, the spread is crossed once. A round trip pays the fees twice and the spread once.',
    citation: 'Manual, Markets and microstructure, transaction costs',
    signature: `markets|round-trip-cost-${venue.name.toLowerCase()}-${size}`,
    answer,
    decimals: 1,
    tolerance: 0.01,
    unit: 'bp',
  };
}

export const microstructureGenerators: Generator[] = [
  {
    id: 'session-open-at-time',
    category: 'markets',
    subgroup: 'microstructure',
    about: 'Is a market open at a given SGT time?',
    generate: openAtTime,
  },
  {
    id: 'stamp-duty',
    category: 'markets',
    subgroup: 'microstructure',
    about: 'The stamp-duty position per market.',
    generate: stampDuty,
  },
  {
    id: 'clearing-house',
    category: 'markets',
    subgroup: 'microstructure',
    about: 'Which body clears each market.',
    generate: clearingHouse,
  },
  {
    id: 'sgx-closing-routine',
    category: 'markets',
    subgroup: 'microstructure',
    about: 'Sequence the phases of the SGX closing routine.',
    generate: closingRoutine,
  },
  {
    id: 'round-trip-cost',
    category: 'markets',
    subgroup: 'microstructure',
    about: 'All-in round-trip cost in basis points, including the levy.',
    generate: roundTripCost,
  },
];

export function venues(): Venue[] {
  return VENUES;
}
