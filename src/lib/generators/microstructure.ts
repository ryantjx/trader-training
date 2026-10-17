/**
 * Market microstructure (README section 2.1), driven by sessions.json.
 *
 * Session times are read from data rather than hard-coded, so the quiz and the
 * market reference pages cannot disagree. The ASX entry in sessions.json carries
 * an explicit "unverified" caveat, and questions derived from an entry with a
 * dstNote are only asked at tiers where the caveat can be shown alongside.
 */
import sessionsData from '../../data/sessions.json';
import type { ChoiceOption, ChoiceQuestion, Generator, OrderingQuestion, Rng, Tier } from '../types';

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

function openAtTime(rng: Rng, tier: Tier): ChoiceQuestion {
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
    tier,
    prompt: `At ${time} SGT, is ${target.name} in continuous trading?`,
    context: `${target.name} continuous session is ${sessionText} SGT${lunchText ? `, with a lunch break ${lunchText}` : ''}.`,
    explain: `${target.name} trades ${sessionText} SGT, so ${time} SGT is ${answerIsOpen ? 'inside' : 'outside'} the session. Opens run JPX first (08:00) then SGX (09:00) then HKEX (09:30); closes run JPX (14:30) then HKEX (16:00) then SGX (17:16).`,
    anchor: 'JPX opens first and closes first. SGX closes last. HKEX sits between the two on both ends.',
    citation: 'README section 2.1; src/content/sgx-market-structure.md, cross-venue session table.',
    signature: `markets|session-${target.id}`,
    options,
    answerId: answerIsOpen ? 'open' : 'closed',
    // Note: options order is fixed here rather than shuffled, because Open/Closed
    // is a two-way toggle and shuffling it would make the game feel arbitrary.
  };
}

function clearingHouse(rng: Rng, tier: Tier): ChoiceQuestion {
  const target = rng.pick(VENUES);
  {
    const optionPool = Array.from(new Set(VENUES.map((v) => v.clearingHouse)));
    const others = rng.sample(optionPool.filter((c) => c !== target.clearingHouse), 3);
    return {
      kind: 'choice',
      id: `micro-${rng.int(0, 1_000_000).toString(36)}`,
      generatorId: 'clearing-house',
      category: 'markets',
      tier,
      prompt: `Which body clears ${target.name} trades?`,
      context: 'Each market separates the trading venue, the clearing house or CCP, and the depository.',
      explain: `${target.name} clears through ${target.clearingHouse}, with ${target.depository} as depository. Note SGX is split: CDP clears cash and SGX-DC clears derivatives, with no cross-margin. JPX is the opposite: one CCP, JSCC, for both.`,
      anchor: 'JPX cross-margins because JSCC is a single CCP. SGX does not, because cash and derivatives clear in separate pools.',
      citation: 'README sections 2.1 and 4.5; src/content/sgx-market-structure.md.',
      signature: `markets|clearing-${target.id}`,
      options: rng.shuffle([
        { id: 'right', label: target.clearingHouse },
        ...others.map((o, i) => ({ id: `w${i}`, label: o })),
      ]),
      answerId: 'right',
    };
  }
}

function stampDuty(rng: Rng, tier: Tier): ChoiceQuestion {
  const target = rng.pick(VENUES);
  return {
    kind: 'choice',
    id: `micro-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'stamp-duty',
    category: 'markets',
    subgroup: 'microstructure',
    tier,
    prompt: `What is the stamp-duty position on an exchange trade in ${target.name}?`,
    context: 'Stamp duty is a per-side transaction levy on stock trades, and it is the single largest cost difference between these markets.',
    explain: `${target.name}: ${target.stampDuty}. HKEX is the expensive market at 0.1% per side, which alone is a material cost for a delta-hedging book. SGX and JPX are stamp-duty-free on exchange trades.`,
    anchor: 'Hong Kong is the only one of the four that charges stamp duty on exchange trades, at 0.1% per side.',
    citation: 'README section 2.1; GovHK stamp duty rates referenced in src/content/sgx-market-structure.md.',
    signature: `markets|stamp-duty-${target.id}`,
    options: rng.shuffle([
      { id: 'right', label: target.stampDuty },
      { id: 'w1', label: '0.1% per side', note: 'That is Hong Kong.' },
      { id: 'w2', label: 'None on exchange trades', note: 'True for SGX and JPX.' },
      { id: 'w3', label: '0.2% per side', note: 'That is the Singapore rate, and only on physical transfer instruments, not exchange trades.' },
    ]),
    answerId: 'right',
  };
}

/** The SGX closing routine, as an ordering question. */
function closingRoutine(rng: Rng, tier: Tier): OrderingQuestion {
  const items = [
    { id: 'pre', label: 'Pre-close phase opens, 17:00 — orders may be entered, modified and cancelled, but nothing matches' },
    { id: 'rand', label: 'Pre-close phase ends at a random point within 17:04-17:05' },
    { id: 'nocancel', label: 'Non-cancel phase, 17:04-17:05 to 17:06 — no entry, modification or cancellation' },
    { id: 'auction', label: 'Closing auction at 17:06 — the closing price is computed and matched' },
    { id: 'tac', label: 'Trade at Close, 17:06 to 17:16 — trade at the fixed closing price' },
    { id: 'close', label: 'Market close at 17:16' },
  ];

  return {
    kind: 'ordering',
    id: `micro-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'sgx-closing-routine',
    category: 'markets',
    subgroup: 'microstructure',
    tier,
    prompt: 'Put the phases of the SGX closing routine in order.',
    context: 'SGX closes later than HKEX and JPX, so this window is often the only one still open in the region.',
    explain:
      'Order: pre-close opens at 17:00; it ends at a random point in 17:04-17:05; then the non-cancel phase to 17:06; the closing auction computes and matches the price at 17:06; Trade at Close runs 17:06-17:16; market close is 17:16.',
    anchor: 'Pre-close, then non-cancel, then auction, then Trade at Close. The random end exists so the closing price cannot be gamed.',
    citation: 'README section 2.1; src/content/sgx-market-structure.md, SGX trading hours.',
    signature: 'markets|sgx-closing-routine',
    items: rng.shuffle(items),
    answerOrder: ['pre', 'rand', 'nocancel', 'auction', 'tac', 'close'],
  };
}

export const microstructureGenerators: Generator[] = [
  {
    id: 'session-open-at-time',
    category: 'markets',
    subgroup: 'microstructure',
    tier: 1,
    about: 'Is a market open at a given SGT time?',
    generate: openAtTime,
  },
  {
    id: 'stamp-duty',
    category: 'markets',
    subgroup: 'microstructure',
    tier: 2,
    about: 'The stamp-duty position per market.',
    generate: stampDuty,
  },
  {
    id: 'clearing-house',
    category: 'markets',
    subgroup: 'microstructure',
    tier: 2,
    about: 'Which body clears each market.',
    generate: clearingHouse,
  },
  {
    id: 'sgx-closing-routine',
    category: 'markets',
    subgroup: 'microstructure',
    tier: 3,
    about: 'Sequence the phases of the SGX closing routine.',
    generate: closingRoutine,
  },
];

export function venues(): Venue[] {
  return VENUES;
}
