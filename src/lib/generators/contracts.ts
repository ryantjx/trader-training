/**
 * Index-futures specifications (README section 3), driven by contracts.json.
 *
 * Tick size is deliberately absent from the data, because the project's table
 * gives multipliers and expiry conventions but not ticks. Rather than invent
 * them, the tick drill is not generated; the point-value drill and the expiry
 * drill are, and both are fully specified by the data that exists.
 */
import contractsData from '../../data/contracts.json';
import { roundTo } from '../money';
import type { ChoiceOption, ChoiceQuestion, Generator, NumericQuestion, Rng, Tier } from '../types';

interface Contract {
  id: string;
  name: string;
  market: string;
  exchange: string;
  underlying: string;
  currency: string;
  multiplierPerPoint: number;
  multiplierNote: string;
  miniMultiplierPerPoint: number | null;
  tickPoints: number | null;
  expiryRule: string;
  expiryRuleShort: string;
}

const CONTRACTS = contractsData.contracts as Contract[];

function pointValue(rng: Rng, tier: Tier): NumericQuestion {
  const c = rng.pick(CONTRACTS);
  const points = rng.pick([1, 10, 25, 50, 100, 250] as const);
  const lots = rng.pick([1, 2, 5, 10, 20] as const);
  const answer = roundTo(points * c.multiplierPerPoint * lots, 2);

  return {
    kind: 'numeric',
    id: `ctr-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'contract-point-value',
    category: 'derivatives',
    subgroup: 'listed',
    tier,
    prompt: `${c.name} has a multiplier of ${c.multiplierPerPoint.toLocaleString('en-US')} ${c.currency} per index point. What is the PnL on ${lots} lot${lots > 1 ? 's' : ''} from a ${points}-point move, in ${c.currency}?`,
    context: `Quoted and cleared on ${c.exchange}.`,
    explain: `Money = points x multiplier x lots = ${points} x ${c.multiplierPerPoint.toLocaleString('en-US')} x ${lots} = ${answer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c.currency}.`,
    anchor: 'The point value is the whole specification. Know it for the contract you hedge with, because notional scales linearly with it and tick arithmetic is impossible without it.',
    citation: 'README section 3, index futures specification table.',
    signature: `derivatives|point-value-${c.id}`,
    answer,
    decimals: 2,
    tolerance: 0,
    unit: c.currency,
  };
}

function notionalValue(rng: Rng, tier: Tier): NumericQuestion {
  const c = rng.pick(CONTRACTS);
  const levels: Record<string, number[]> = {
    hsi: [22_000, 24_000, 26_000],
    mhi: [22_000, 24_000, 26_000],
    'nikkei-ose': [35_000, 39_000, 42_000],
    'nikkei-sgx': [35_000, 39_000, 42_000],
    topix: [2_500, 2_750, 3_000],
    kospi200: [330, 360, 400],
    a50: [12_500, 14_500, 16_000],
    spi200: [7_800, 8_400, 9_000],
  };
  const level = rng.pick(levels[c.id] ?? [10_000]);
  const answer = roundTo(level * c.multiplierPerPoint, 2);

  return {
    kind: 'numeric',
    id: `ctr-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'contract-notional',
    category: 'derivatives',
    subgroup: 'listed',
    tier,
    prompt: `The ${c.underlying} is at ${level.toLocaleString('en-US')}. What is the notional of one ${c.name} contract, in ${c.currency} to 2 decimal places?`,
    context: `Multiplier ${c.multiplierPerPoint.toLocaleString('en-US')} ${c.currency} per index point.`,
    explain: `Notional = level x multiplier = ${level.toLocaleString('en-US')} x ${c.multiplierPerPoint.toLocaleString('en-US')} = ${answer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c.currency}.`,
    anchor: 'Notional is level times point value. This is the number that decides how many lots to trade to hedge a given delta.',
    citation: 'README section 3.',
    signature: `derivatives|notional-${c.id}`,
    answer,
    decimals: 2,
    tolerance: 0,
    unit: c.currency,
  };
}

function expiryConvention(rng: Rng, tier: Tier): ChoiceQuestion {
  const c = rng.pick(CONTRACTS);
  const others = Array.from(
    new Set(CONTRACTS.filter((o) => o.expiryRuleShort !== c.expiryRuleShort).map((o) => o.expiryRuleShort)),
  );
  const wrong = rng.sample(others, 3);

  const options: ChoiceOption[] = [
    { id: 'right', label: c.expiryRuleShort },
    ...wrong.map((w, i) => ({ id: `w${i}`, label: w })),
  ];

  return {
    kind: 'choice',
    id: `ctr-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'contract-expiry',
    category: 'derivatives',
    subgroup: 'listed',
    tier,
    prompt: `When does ${c.name} expire?`,
    context: `Traded on ${c.exchange}.`,
    explain: `${c.name}: ${c.expiryRule}.`,
    anchor: 'Japan settles on the second Friday (SQ). Korea on the second Thursday. Australia on the third Thursday. Hong Kong avoids the last business day of the month, settling the day before. A50 is the last business day.',
    citation: 'README section 3.',
    signature: `derivatives|expiry-${c.id}`,
    options: rng.shuffle(options),
    answerId: 'right',
  };
}

function crossListed(rng: Rng, tier: Tier): ChoiceQuestion {
  const pairs = [
    {
      underlying: 'Nikkei 225',
      correct: 'OSE and SGX',
      prompt: 'Which venues list futures on the Nikkei 225?',
      explain:
        'The Nikkei 225 trades on OSE in Japan and on SGX offshore, in both JPY and USD on SGX. The SGX contract is the one that keeps trading when Japan is shut, which is why it is the hedge leg outside Tokyo hours.',
    },
    {
      underlying: 'FTSE China A50',
      correct: 'SGX only',
      prompt: 'Which offshore venue lists the flagship China A-share futures contract?',
      explain:
        'FTSE China A50 futures trade on SGX and are the standard offshore China proxy. The onshore analogue is CSI 300 on CFFEX, which is not accessible to most offshore participants.',
    },
    {
      underlying: 'MSCI Singapore',
      correct: 'SGX only',
      prompt: 'Where are MSCI Singapore futures and options listed?',
      explain:
        'The MSCI suite trades on SGX. Note that the MSCI Singapore index options are effectively zero volume, so the futures are the usable leg.',
    },
    {
      underlying: 'KOSPI 200',
      correct: 'KRX only',
      prompt: 'Where do KOSPI 200 futures trade?',
      explain:
        'KOSPI 200 futures trade on KRX. There is no offshore listing, so the hedge is only available while the Korean market is open.',
    },
  ] as const;

  const item = rng.pick(pairs);
  const allVenues = ['SGX only', 'OSE and SGX', 'KRX only', 'HKFE only', 'SGX and HKFE'];
  const wrong = allVenues.filter((v) => v !== item.correct).slice(0, 3);

  return {
    kind: 'choice',
    id: `ctr-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'contract-cross-listed',
    category: 'derivatives',
    subgroup: 'listed',
    tier,
    prompt: item.prompt,
    context: 'Offshore access matters for a desk that has to hedge when the home market is shut.',
    explain: item.explain,
    anchor: 'Japan and India have offshore listings (SGX); Korea and onshore China do not. Offshore access is what makes a hedge tradeable outside home hours.',
    citation: 'README section 3; src/content/sgx-market-structure.md, derivatives suite.',
    signature: `derivatives|cross-listed-${item.underlying.replace(/\s+/g, '-').toLowerCase()}`,
    options: rng.shuffle([
      { id: 'right', label: item.correct },
      ...wrong.map((w, i) => ({ id: `w${i}`, label: w })),
    ]),
    answerId: 'right',
  };
}

export const contractGenerators: Generator[] = [
  {
    id: 'contract-point-value',
    category: 'derivatives',
    subgroup: 'listed',
    tier: 1,
    about: 'Point value of an index futures contract, in money.',
    generate: pointValue,
  },
  {
    id: 'contract-notional',
    category: 'derivatives',
    subgroup: 'listed',
    tier: 2,
    about: 'Notional of one index futures contract at a given level.',
    generate: notionalValue,
  },
  {
    id: 'contract-expiry',
    category: 'derivatives',
    subgroup: 'listed',
    tier: 2,
    about: 'Expiry convention per index futures contract.',
    generate: expiryConvention,
  },
  {
    id: 'contract-cross-listed',
    category: 'derivatives',
    subgroup: 'listed',
    tier: 3,
    about: 'Which venues list the major Asian index contracts.',
    generate: crossListed,
  },
];

export function contracts(): Contract[] {
  return CONTRACTS;
}
