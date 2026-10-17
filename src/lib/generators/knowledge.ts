/**
 * Asia market knowledge (README section 2.3).
 *
 * Calendars, index construction, access channels and central banks — the
 * non-derivative market layer. Facts here are statements about market convention
 * rather than live data, so they do not go stale in the way a rate does.
 *
 * This file was split out of a mixed `knowledge` category during the move to the
 * three-group taxonomy. The volatility-surface content that used to sit
 * alongside it is derivatives material and now lives in `vol-surface.ts`.
 */
import type { ChoiceOption, ChoiceQuestion, Generator, Rng, Tier } from '../types';

function build(
  rng: Rng,
  generatorId: string,
  signature: string,
  prompt: string,
  context: string,
  explain: string,
  anchor: string,
  citation: string,
  correct: string,
  wrong: readonly string[],
  tier: Tier,
): ChoiceQuestion {
  return {
    kind: 'choice',
    id: `${generatorId}-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId,
    category: 'markets',
    tier,
    prompt,
    context,
    explain,
    anchor,
    citation,
    signature,
    options: rng.shuffle([
      { id: 'right', label: correct },
      ...wrong.map((w, i) => ({ id: `w${i}`, label: w })),
    ]),
    answerId: 'right',
  };
}

function calendar(rng: Rng, tier: Tier): ChoiceQuestion {
  const events = [
    {
      id: 'golden-week',
      market: 'Japan',
      correct: 'Golden Week, late April to early May',
      wrong: ['Lunar New Year', 'Obon in mid-August', 'Chuseok'],
      explain:
        'Golden Week runs from late April into early May and is Japan\'s longest holiday cluster. It coincides with the April dividend season, which makes it a dense period for dividend-sensitive structures.',
    },
    {
      id: 'lunar-new-year',
      market: 'Hong Kong and Singapore',
      correct: 'Lunar New Year',
      wrong: ['Golden Week', 'Obon', 'Deepavali'],
      explain:
        'Lunar New Year moves with the lunar calendar, falling between late January and mid-February. Hong Kong, Singapore and Taiwan close for several days, and the exact dates change every year, so the trading calendar has to be looked up rather than assumed.',
    },
    {
      id: 'obon',
      market: 'Japan',
      correct: 'Obon in mid-August',
      wrong: ['Golden Week', 'Lunar New Year', 'Chuseok'],
      explain:
        'Obon is a mid-August holiday period in Japan. Volume thins noticeably, which matters for anything that has to be hedged through it.',
    },
    {
      id: 'chuseok',
      market: 'Korea',
      correct: 'Chuseok',
      wrong: ['Obon', 'Golden Week', 'Lunar New Year'],
      explain:
        'Chuseok is the Korean harvest festival, moving with the lunar calendar, typically in September or October. Korean markets close for several days.',
    },
  ] as const;

  const item = rng.pick(events);
  return build(
    rng,
    'calendar-event',
    `knowledge|calendar-${item.id}`,
    `Which holiday period closes the ${item.market} market?`,
    'The Asian trading calendar is not a single calendar: some holidays are lunar and move every year.',
    item.explain,
    'Lunar-calendar holidays move every year, so check the calendar rather than assuming the date. Solar fixed holidays are the exception.',
    'README section 5, trading calendar.',
    item.correct,
    item.wrong,
    tier,
  );
}

function accessChannel(rng: Rng, tier: Tier): ChoiceQuestion {
  const cases = [
    {
      id: 'northbound',
      prompt: 'A foreign institutional investor wants to buy a Shanghai-listed A-share. Which channel do they typically use?',
      correct: 'Stock Connect (northbound)',
      wrong: ['Stock Connect (southbound)', 'QFII only, since Stock Connect closed', 'They cannot: A-shares are closed to foreign investors'],
      explain:
        'Stock Connect northbound lets offshore investors buy mainland-listed shares through Hong Kong. Southbound is the mirror: mainland investors buying Hong Kong-listed shares. QFII remains a separate, licence-based channel, typically used for larger or more complex mandates.',
      anchor: 'Northbound equals offshore buying onshore. Southbound equals mainland money buying Hong Kong.',
    },
    {
      id: 'southbound',
      prompt: 'Mainland Chinese investors buying Hong Kong-listed shares is known as what?',
      correct: 'Stock Connect (southbound)',
      wrong: ['Stock Connect (northbound)', 'The ADR route', 'QFII'],
      explain:
        'Southbound flow is mainland money buying Hong Kong shares, and it has materially changed the character of the Hong Kong market: turnover is momentum-driven and China-linked. This is a large part of why HKEX is deep but China-linked rather than broad.',
      anchor: 'Southbound flow is why Hong Kong is deep but China-linked, not a broad local market.',
    },
    {
      id: 'h-a',
      prompt: 'A company has both an H-share listing in Hong Kong and an A-share listing onshore. What is the usual relationship?',
      correct: 'They normally trade at different prices, and the spread is a persistent basis',
      wrong: ['They are fungible and trade at the same price', 'The H-share is always at a premium', 'The A-share is always at a premium'],
      explain:
        'The two listings are not fungible: different investor bases, capital controls and settlement. They normally trade at a persistent spread, and the direction of that spread has moved over time rather than being a fixed rule. Anything that fixes on one and hedges the other owns that basis.',
      anchor: 'H and A shares are not fungible. Never assume parity, and check which one your fixing references.',
    },
  ] as const;

  const item = rng.pick(cases);
  return build(
    rng,
    'access-channel',
    `knowledge|access-${item.id}`,
    item.prompt,
    'Access and flows determine who can hold what, and therefore what can be arbitraged.',
    item.explain,
    item.anchor,
    'README section 5, access and flows.',
    item.correct,
    item.wrong,
    tier,
  );
}

function centralBank(rng: Rng, tier: Tier): ChoiceQuestion {
  const cases = [
    {
      id: 'mas',
      prompt: 'What is the MAS policy instrument in Singapore?',
      correct: 'The S$NEER, a trade-weighted exchange-rate band',
      wrong: ['A policy interest rate', 'Reserve requirements only', 'Direct credit controls'],
      explain:
        'MAS targets the Singapore dollar nominal effective exchange rate, a trade-weighted band, rather than an interest rate. That makes SGD uniquely a policy-driven currency, and means SGD rates are largely imported from the US rather than set locally.',
      anchor: 'MAS manages the currency, not the interest rate. SGD rates follow the US, and the SGD forward points follow the rate differential.',
    },
    {
      id: 'pbc',
      prompt: 'Which of these is a PBoC policy rate?',
      correct: 'The 7-day reverse repo rate, alongside the MLF and the LPR',
      wrong: ['The federal funds rate', 'The S$NEER', 'The overnight indexed swap'],
      explain:
        'The PBoC operates through a set of administered rates: the 7-day reverse repo as the main short-term rate, the MLF as a medium-term lending facility, and the LPR as the loan prime rate which is the lending benchmark. There is no single policy rate in the way there is in the US.',
      anchor: 'The PBoC has a set of administered rates rather than one policy rate. The 7-day reverse repo is the main short-term one.',
    },
  ] as const;

  const item = rng.pick(cases);
  return build(
    rng,
    'central-bank',
    `knowledge|central-bank-${item.id}`,
    item.prompt,
    'The regional central banks operate in materially different ways, and the difference is testable.',
    item.explain,
    item.anchor,
    'README section 5, rates and central banks.',
    item.correct,
    item.wrong,
    tier,
  );
}

function indexMembership(rng: Rng, tier: Tier): ChoiceQuestion {
  const cases = [
    {
      id: 'sti-size',
      prompt: 'How many constituents does the Straits Times Index have?',
      correct: '30',
      wrong: ['50', '100', '225'],
      explain:
        'The STI is 30 names, and those 30 are about 65% of market capitalisation and 74% of traded value. The other roughly 570 listed names share the rest.',
      anchor: 'STI is 30 names. Nikkei 225 is 225. TOPIX is broad, covering the whole market rather than a fixed count.',
    },
    {
      id: 'nikkei-construction',
      prompt: 'How is the Nikkei 225 constructed?',
      correct: 'Price-weighted',
      wrong: ['Market-cap weighted', 'Equal-weighted', 'Free-float market-cap weighted'],
      explain:
        'The Nikkei 225 is price-weighted, so a high-priced stock has more influence than a large one. The STI, TOPIX and most MSCI indices are free-float market-cap weighted. The construction matters because it changes which names actually drive the index level.',
      anchor: 'Nikkei 225 is price-weighted. STI, TOPIX and MSCI are free-float cap-weighted. A price-weighted index is moved by high-priced stocks, not big ones.',
    },
    {
      id: 'topix-construction',
      prompt: 'How is TOPIX constructed?',
      correct: 'Free-float market-cap weighted, covering the broad market',
      wrong: ['Price-weighted, like the Nikkei', 'Equal-weighted across 225 names', 'A fixed 30-name index'],
      explain:
        'TOPIX is free-float market-cap weighted and covers the broad market rather than a fixed count. It is the deeper and more representative Japanese benchmark, which is why it carries the more orderly vol surface.',
      anchor: 'TOPIX is the broad Japanese benchmark; the Nikkei is a price-weighted 225. The distinction changes both the vol surface and the hedge.',
    },
  ] as const;

  const item = rng.pick(cases);
  return build(
    rng,
    'index-construction',
    `knowledge|index-construction-${item.id}`,
    item.prompt,
    'Index construction determines what actually moves the index, which in turn determines the hedge.',
    item.explain,
    item.anchor,
    'README section 5, index membership and weights.',
    item.correct,
    item.wrong,
    tier,
  );
}

export const knowledgeGenerators: Generator[] = [
  {
    id: 'calendar-event',
    category: 'markets',
    tier: 1,
    about: 'Which holiday periods close which Asian markets.',
    generate: calendar,
  },
  {
    id: 'access-channel',
    category: 'markets',
    tier: 2,
    about: 'Stock Connect, QFII and the H/A share relationship.',
    generate: accessChannel,
  },
  {
    id: 'central-bank',
    category: 'markets',
    tier: 2,
    about: 'How the regional central banks differ.',
    generate: centralBank,
  },
  {
    id: 'index-construction',
    category: 'markets',
    tier: 2,
    about: 'Index construction and membership.',
    generate: indexMembership,
  },
];

// Re-exported under the old name so registry.ts keeps working; both names point
// at the same list of market-knowledge generators.
export { knowledgeGenerators as marketKnowledgeGenerators };
