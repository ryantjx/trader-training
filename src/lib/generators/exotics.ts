/**
 * Asia exotic options (README section 4).
 *
 * The core of the desk, and the content the rest of the manual serves. These
 * generators test the things an exotics trader has to know reflexively: which
 * structure a term sheet describes, which way the Greeks point, what the
 * stickiness convention does to the mark, and — the README's central point —
 * what can and cannot be hedged on-exchange.
 */
import type { ChoiceOption, ChoiceQuestion, Generator, Rng, Tier } from '../types';

interface Structure {
  id: string;
  name: string;
  /** Distinguishing features, as a trader would state them. */
  traits: string;
  greeks: string;
  where: string;
}

const STRUCTURES: readonly Structure[] = [
  {
    id: 'worst-of-autocall',
    name: 'Worst-of autocallable',
    traits:
      'Multiple underlyings. Coupon paid while all are above the coupon barrier. Redeems early the first time ALL are at or above the autocall level on an observation date. Principal at risk if ANY closes below the knock-in at maturity.',
    greeks: 'Short correlation, and the delta is the delta of the current worst performer, so it jumps between names',
    where: 'Hong Kong, Japan, Korea and Singapore retail and private-bank flow',
  },
  {
    id: 'snowball',
    name: 'Snowball',
    traits:
      'Single underlying. No coupon barrier. Knock-in at about 75% of initial and autocall at about 103%, with a high conditional coupon. Short a knock-in put and short a call spread.',
    greeks: 'Long gamma above the knock-in, short gamma into it',
    where: 'China, and the dominant Chinese retail structure',
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    traits: 'A snowball with a coupon barrier added, so the coupon is conditional rather than paid on every observation.',
    greeks: 'As a snowball, plus a digital-like exposure between the strike and the coupon barrier',
    where: 'China and Hong Kong',
  },
  {
    id: 'accumulator',
    name: 'Accumulator',
    traits:
      'Buys a fixed quantity each day while the price is inside a range. Below the strike the buyer takes DOUBLE quantity, down to a knock-in. A knock-out above ends the structure early.',
    greeks: 'The seller is short gamma and short vol',
    where: 'Hong Kong, retail, distributed by brokers',
  },
  {
    id: 'decumulator',
    name: 'Decumulator',
    traits: 'The mirror of an accumulator: sells a fixed quantity each day while the price is inside a range, with leveraged upside downside.',
    greeks: 'Short gamma and short vol, mirrored',
    where: 'Hong Kong',
  },
  {
    id: 'reset-barrier',
    name: 'Reset barrier option',
    traits:
      'A knock-in or knock-out whose barrier is RE-FIXED on a reset date if it has been breached, so the option does not die. Trigger depends on the reset schedule and rule.',
    greeks: 'The reset introduces a forward-starting barrier exposure, so delta is discontinuous at both the barrier and the reset',
    where: "Hong Kong and Korea retail structures — Asia's distinguishing barrier convention",
  },
  {
    id: 'parisian',
    name: 'Parisian or window barrier',
    traits:
      'Trigger requires the barrier to have been breached for a cumulative number of days, or during a consecutive window, rather than on an instantaneous touch.',
    greeks: 'Softer, more continuous delta near the barrier than a plain barrier',
    where: 'Asia and Europe',
  },
  {
    id: 'cliquet',
    name: 'Cliquet',
    traits:
      'Locks in a series of periodic returns with a local cap and floor, converting volatile returns into a smoothed coupon. Marks to FORWARD vol, not spot vol.',
    greeks: 'Long forward vol, short spot vol — effectively short gamma',
    where: 'Japan retail and structured notes',
  },
  {
    id: 'range-accrual',
    name: 'Range accrual',
    traits: 'Pays a coupon for each day the underlying fixes inside a range. The coupon accrues day by day.',
    greeks: 'Short gamma, and the fixing convention is part of the payoff',
    where: 'Asia retail and private bank',
  },
  {
    id: 'dispersion',
    name: 'Dispersion',
    traits:
      'A portfolio of single-stock options hedged with an index option. The desk is long single-name vol, short index vol and short correlation.',
    greeks: 'Long single-name vol, short index vol, short correlation',
    where: 'Korea and institutional flow — hard to run in Asia because single-name vol is OTC only',
  },
  {
    id: 'one-touch',
    name: 'One-touch and no-touch',
    traits:
      'A one-touch pays if the barrier is touched at any time. A no-touch is a digital that pays only if the barrier is NEVER touched.',
    greeks: 'Very high gamma near the barrier; the no-touch is the mirror of the one-touch',
    where: 'Asia and global',
  },
];

const byId = new Map(STRUCTURES.map((s) => [s.id, s]));

function identifyStructure(rng: Rng, tier: Tier): ChoiceQuestion {
  const target = rng.pick(STRUCTURES);
  const others = rng.sample(STRUCTURES.filter((s) => s.id !== target.id), 3);

  const options: ChoiceOption[] = [
    { id: 'right', label: target.name },
    ...others.map((o, i) => ({ id: `w${i}`, label: o.name })),
  ];

  return {
    kind: 'choice',
    id: `exo-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'exotic-identify',
    category: 'derivatives',
    subgroup: 'exotic',
    tier,
    prompt: `A term sheet describes the following. Which structure is it?\n\n${target.traits}`,
    context: 'Identify the structure from the payoff mechanics, not from the marketing name.',
    explain: `This is a ${target.name}. Greeks: ${target.greeks}. Sold mainly in: ${target.where}.`,
    anchor: 'Classify by payoff mechanics: does it autocall, is the coupon conditional, is the downside leveraged, is the barrier reset? That gives the structure and the hedge.',
    citation: 'README section 4.1, exotic payoffs to know by heart.',
    signature: `exotics|identify-${target.id}`,
    options: rng.shuffle(options),
    answerId: 'right',
  };
}

const GREEK_ANSWERS: readonly { id: string; label: string; note?: string }[] = [
  { id: 'short-corr', label: 'Short correlation' },
  { id: 'long-corr', label: 'Long correlation', note: 'Think about what the worst-of feature does to a basket.' },
  { id: 'long-fwdvol', label: 'Long forward vol, short spot vol' },
  { id: 'short-fwdvol', label: 'Short forward vol, long spot vol', note: 'That is the opposite of a cliquet.' },
  { id: 'long-gamma', label: 'Long gamma and long vol' },
  { id: 'short-gamma', label: 'Short gamma and short vol' },
];

function greekDirection(rng: Rng, tier: Tier): ChoiceQuestion {
  const cases = [
    {
      id: 'worst-of-autocall',
      prompt: 'You have sold a worst-of autocallable on three Asian bank stocks. What is your primary correlation exposure?',
      answerId: 'short-corr',
      explain:
        'A worst-of pays on the worst performer, so its value falls as correlation falls: the components are more likely to diverge, and the worst is worse. The seller is short correlation and pays for it in worst-of spread.',
      anchor: 'Worst-of means short correlation. Always.',
    },
    {
      id: 'cliquet',
      prompt: 'You have bought a cliquet with a local cap and floor. What is your vol exposure?',
      answerId: 'long-fwdvol',
      explain:
        'A cliquet locks in periodic returns, so it marks to forward vol rather than spot vol. You are long forward vol and, because the cap and floor clip the returns, effectively short spot vol. The position is a bet on the forward-vol versus spot-vol spread.',
      anchor: 'Cliquet equals long forward vol, short spot vol. It is a vol-of-vol structure, not a directional one.',
    },
    {
      id: 'accumulator',
      prompt: 'You have sold an accumulator to a client. What is your gamma and vol position?',
      answerId: 'short-gamma',
      explain:
        'Below the strike the buyer takes double quantity, so your downside is leveraged. You are short a strip of put spreads plus a short knock-out call: short gamma and short vol.',
      anchor: 'Accumulators are sold, so the desk is short gamma and short vol. The name "I kill you later" comes from exactly this asymmetry.',
    },
    {
      id: 'snowball',
      prompt: 'You have sold a snowball with a knock-in at 75% and autocall at 103%. What is your gamma profile?',
      answerId: 'long-gamma',
      explain:
        'Above the knock-in the short call spread leaves you long gamma; as spot approaches and crosses the knock-in you become short gamma. The sign flip around the knock-in is the defining feature of the position.',
      anchor: 'Gamma flips sign around the knock-in level. That is where the hedge has to be watched most closely.',
    },
  ] as const;

  const item = rng.pick(cases);
  const distractorIds = rng.sample(
    GREEK_ANSWERS.filter((g) => g.id !== item.answerId),
    3,
  );
  const answerOption = GREEK_ANSWERS.find((g) => g.id === item.answerId) as ChoiceOption;

  return {
    kind: 'choice',
    id: `exo-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'exotic-greeks',
    category: 'derivatives',
    subgroup: 'exotic',
    tier,
    prompt: item.prompt,
    context: 'Reason from the payoff, not from a memorised position.',
    explain: item.explain,
    anchor:
      'Worst-of: short correlation. Cliquet: long forward vol. Accumulator sold: short gamma. Autocallable: gamma flips at the knock-in.',
    citation: 'README section 4.1.',
    signature: `exotics|greeks-${item.id}`,
    options: rng.shuffle([{ ...answerOption, id: 'right' }, ...distractorIds.map((g, i) => ({ ...g, id: `w${i}` }))]),
    answerId: 'right',
  };
}

function stickiness(rng: Rng, tier: Tier): ChoiceQuestion {
  const cases = [
    {
      id: 'sticky-local-vol',
      prompt:
        'Spot falls 5% on a barrier book. Under the sticky-LOCAL-VOL convention, what happens to the implied vol you mark a fixed barrier level at?',
      answerId: 'unchanged',
      explain:
        'Sticky-local-vol holds the vol at a fixed spot LEVEL constant, so the vol at the barrier level is unchanged while the skew slides through the fixed strikes. This is the correct mental model for a barrier-heavy book precisely because a barrier is a fixed spot level, not a fixed strike or a fixed delta.',
      anchor: 'Barrier books mark on sticky-local-vol: vol is attached to the spot level, not the strike.',
    },
    {
      id: 'sticky-strike',
      prompt:
        'Spot falls 5%. Under the sticky-STRIKE convention, what happens to ATM implied vol?',
      answerId: 'rises',
      explain:
        'Sticky-strike fixes vol as a function of the fixed strike and does not move the surface. Because the skew is downward-sloping in strike, the level that is now at-the-money sits at a HIGHER strike than the old ATM, so ATM vol rises. The surface stays put and spot walks along it.',
      anchor: 'With sticky-strike and downward skew, ATM vol rises as spot falls. The surface does not move; spot does.',
    },
    {
      id: 'sticky-delta',
      prompt:
        'Spot falls 5%. Under the sticky-DELTA (sticky-moneyness) convention, what happens to ATM implied vol?',
      answerId: 'unchanged',
      explain:
        'Sticky-delta anchors the smile to delta, so the whole skew shifts with spot and the ATM point keeps its vol. The surface moves with the market rather than staying fixed.',
      anchor: 'Sticky-delta means the smile travels with spot, so ATM vol is unchanged. Sticky-strike means the smile stays and ATM vol moves.',
    },
  ] as const;

  const directionOptions: ChoiceOption[] = [
    { id: 'rises', label: 'Rises' },
    { id: 'falls', label: 'Falls', note: 'Remember the skew is downward-sloping.' },
    { id: 'unchanged', label: 'Unchanged' },
  ];

  const item = rng.pick(cases);
  const answer = directionOptions.find((o) => o.id === item.answerId) as ChoiceOption;

  return {
    kind: 'choice',
    id: `exo-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'exotic-stickiness',
    category: 'derivatives',
    subgroup: 'exotic',
    tier,
    prompt: item.prompt,
    context: 'Asian index skew is pronounced, with puts trading rich to calls.',
    explain: item.explain,
    anchor: 'Know which convention the book is marked on before arguing about a mark. The same position marks differently under each.',
    citation: 'README section 4.2, Vol surface mechanics.',
    signature: `exotics|stickiness-${item.id}`,
    options: directionOptions,
    answerId: item.answerId,
    // Not shuffled: rises/falls/unchanged reads as a natural three-way scale.
  };
}

function hedgeability(rng: Rng, tier: Tier): ChoiceQuestion {
  const risks = [
    {
      id: 'single-name-vega',
      prompt: 'Where must you hedge the single-name vega on a barrier option written on a Singapore bank?',
      answerId: 'otc',
      explain:
        'SGX and HKEX list no single-stock options and no single-stock futures, so single-name vol can only be sourced OTC, dealer to dealer. That brings wider spreads, dealer dependence, no central clearing, ISDA and CSA machinery, and harder marks. Single-name delta also has no listed leg, so it is borrow or an OTC swap.',
      anchor: 'The hedge leg in Asia is index, but the risk is usually single-name. That mismatch is why the OTC vol market sets the price.',
    },
    {
      id: 'index-delta',
      prompt: 'Where do you hedge the index delta on a Nikkei 225 autocallable?',
      answerId: 'listed',
      explain:
        'Index delta is the one risk that is cheap and deep on-exchange. Nikkei 225 futures are listed both on OSE in Japan and on SGX offshore, in JPY and USD. This is the practical hedge leg, and the offshore listing means it trades when Tokyo is shut.',
      anchor: 'Index delta is the only genuinely liquid on-exchange hedge in the region. Everything else is OTC or borrow.',
    },
    {
      id: 'correlation',
      prompt: 'Where do you hedge the correlation on a Korean dispersion book?',
      answerId: 'nothing',
      explain:
        'There is no listed correlation product anywhere in the region. The desk holds correlation risk until it can be offset OTC with another dealer, typically by finding an offsetting worst-of or dispersion trade. This is why dispersion books are hard to run in Asia.',
      anchor: 'Correlation cannot be hedged on-exchange at all. It can only be offset by finding the opposite trade.',
    },
    {
      id: 'dividend',
      prompt: 'You need to hedge the dividend risk on an A50 total-return structure. What listed instrument is available?',
      answerId: 'nothing',
      explain:
        'The only listed dividend leg in the region is the SGX Nikkei Stock Average Dividend Point Index Future, and it is thinly traded. A50, Nifty, MSCI and STI have no listed dividend leg, so dividend risk on those indices is hedged OTC with dividend swaps or priced into the structure.',
      anchor: 'Only the Nikkei has a listed dividend leg on SGX. Everything else is an OTC dividend swap or a modelled assumption.',
    },
    {
      id: 'quanto',
      prompt: 'You have USD quanto exposure on a Nikkei structure. Where is that hedged?',
      answerId: 'partial',
      explain:
        'SGX lists USD/CNH and USD/INR futures and options, which covers some of the regional FX. The JPY quanto leg is only partly covered by listed instruments, so the remainder is OTC. The quanto adjustment to vol can be large, and the USD-quoted Nikkei is the canonical example.',
      anchor: 'Listed Asian FX cover is partial: CNH and INR are listed on SGX, the rest of the quanto is OTC.',
    },
  ] as const;

  const answers: Record<string, ChoiceOption> = {
    otc: { id: 'otc', label: 'OTC only, dealer to dealer' },
    listed: { id: 'listed', label: 'On-exchange index futures' },
    nothing: { id: 'nothing', label: 'No listed or clean hedge exists' },
    partial: { id: 'partial', label: 'Partly listed FX, the rest OTC' },
  };

  const item = rng.pick(risks);
  const correct = answers[item.answerId] as ChoiceOption;
  const others = Object.values(answers).filter((a) => a.id !== item.answerId);

  return {
    kind: 'choice',
    id: `exo-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'exotic-hedgeability',
    category: 'derivatives',
    subgroup: 'exotic',
    tier,
    prompt: item.prompt,
    context:
      'SGX and HKEX list no single-stock options and no single-stock futures. JPX does list single-stock derivatives domestically.',
    explain: item.explain,
    anchor: 'Index delta: listed. Single-name delta: borrow or OTC. Single-name vega and gamma: OTC. Correlation: nothing. Dividends: only the Nikkei.',
    citation: 'README section 4.5, the Asia exotics hedge gap.',
    signature: `exotics|hedgeability-${item.id}`,
    options: rng.shuffle([
      { ...correct, id: 'right' },
      ...others.map((o, i) => ({ ...o, id: `w${i}` })),
    ]),
    answerId: 'right',
  };
}

function convention(rng: Rng, tier: Tier): ChoiceQuestion {
  const cases = [
    {
      id: 'rearrange-put',
      prompt: 'Which structure averages its fixings over a window rather than observing at a single date?',
      answerId: 'asian',
      explain:
        'An Asian option (an average-rate option) averages over a set of fixings. The averaging type matters: arithmetic versus geometric average, the length of the window, and whether fixings before the trade date are included. This is distinct from the region\'s resetting and Parisian barriers, which are about the trigger rather than the payoff.',
      anchor: 'Asian means averaging. Do not confuse the product with the region: an Asian option traded in Asia is still just an average-rate option.',
    },
    {
      id: 'fixing-source',
      prompt:
        'A structure on an H-share references the A-share close for its fixing. What risk does that create?',
      answerId: 'basis',
      explain:
        'The H-share trades in Hong Kong and the A-share in Shanghai or Shenzhen, at different times and often at different levels. Fixing on the A-share close while hedging the H-share introduces a cross-market basis risk that is not visible in a single-venue model. This convention is specific to China-linked structures.',
      anchor: 'If the fixing source is not the instrument you hedge with, you own basis risk. Check the fixing definition before pricing.',
    },
    {
      id: 'trading-window',
      prompt:
        'Why do Korean structures reference an observation inside the volatility-interruption window rather than the raw close?',
      answerId: 'gameproof',
      explain:
        'The trading window exists so that a barrier or a fixing cannot be gamed in a thin hour. Korea has intraday volatility-interruption rules, Hong Kong has the CAS closing window, SGX has Trade at Close, and the ASX has a closing auction. The window changes both the observation price and the hedging opportunity.',
      anchor: 'Trading windows protect a fixing or barrier from being gamed. Know which window the structure references.',
    },
    {
      id: 'delta-convention',
      prompt:
        'Two desks quote "the 25-delta put" on the same single stock and give different strikes. What is the most likely cause?',
      answerId: 'convention',
      explain:
        'Spot delta, forward delta and driftless delta are all standard, and driftless delta is the common single-stock and Korean convention. For a call, spot and forward delta differ by the discount factor, and a driftless delta strips out the rate and dividend drift. The same "25-delta" therefore maps to three different strikes. An exotic\'s mark moves if the convention is changed after the trade.',
      anchor: 'Spot, forward and driftless delta are all in use. Establish the convention before comparing a strike to another desk.',
    },
  ] as const;

  const answers: Record<string, ChoiceOption> = {
    asian: { id: 'asian', label: 'An average-rate (Asian) option' },
    basis: { id: 'basis', label: 'A cross-market basis between the H-share and the A-share' },
    gameproof: { id: 'gameproof', label: 'To stop the fixing or barrier being gamed in a thin hour' },
    convention: { id: 'convention', label: 'A different delta convention: spot, forward or driftless' },
  };

  const item = rng.pick(cases);
  const correct = answers[item.answerId] as ChoiceOption;
  const others = Object.values(answers).filter((a) => a.id !== item.answerId);

  return {
    kind: 'choice',
    id: `exo-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'exotic-convention',
    category: 'derivatives',
    subgroup: 'exotic',
    tier,
    prompt: item.prompt,
    context: 'Observation, averaging and fixing conventions determine the payoff and are a common source of disputes.',
    explain: item.explain,
    anchor: 'Conventions are where mispricing and disputes originate. Read the fixing and averaging definitions before pricing.',
    citation: 'README sections 4.3 and 4.4.',
    signature: `exotics|convention-${item.id}`,
    options: rng.shuffle([
      { ...correct, id: 'right' },
      ...others.map((o, i) => ({ ...o, id: `w${i}` })),
    ]),
    answerId: 'right',
  };
}

function whereSold(rng: Rng, tier: Tier): ChoiceQuestion {
  const map = [
    { market: 'China', product: 'Snowballs, autocallables and fixed-coupon notes' },
    { market: 'Korea', product: 'ELS and ELW, plus dispersion and worst-of structures' },
    { market: 'Hong Kong', product: 'Accumulators, CBBCs and derivative warrants' },
    { market: 'Japan', product: 'Nikkei-linked autocallables, cliquets and FX structures' },
    { market: 'Singapore', product: 'Index autocallables and total-return swaps sold to private banks' },
  ];

  const target = rng.pick(map);
  const others = rng.sample(map.filter((m) => m.market !== target.market), 3);

  return {
    kind: 'choice',
    id: `exo-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'exotic-where-sold',
    category: 'derivatives',
    subgroup: 'exotic',
    tier,
    prompt: `Which structured products dominate retail flow in ${target.market}?`,
    context: 'Retail appetite differs by market and drives what the desk is asked to price.',
    explain: `${target.market}: ${target.product}. Distribution differs too: Hong Kong and Korea reach retail through brokers, Japan through retail brokers and structured notes, and Singapore through the private-bank channel, so tickets are large and the buyer base is narrow.`,
    anchor: 'The commercial map matters: it tells you which structures you will be asked for, and through which channel.',
    citation: 'README section 4.4, Where each product is sold.',
    signature: `exotics|where-sold-${target.market.toLowerCase()}`,
    options: rng.shuffle([
      { id: 'right', label: target.product },
      ...others.map((o, i) => ({ id: `w${i}`, label: o.product })),
    ]),
    answerId: 'right',
  };
}

export const exoticGenerators: Generator[] = [
  {
    id: 'exotic-identify',
    category: 'derivatives',
    subgroup: 'exotic',
    tier: 2,
    about: 'Identify the exotic structure from its payoff mechanics.',
    generate: identifyStructure,
  },
  {
    id: 'exotic-greeks',
    category: 'derivatives',
    subgroup: 'exotic',
    tier: 3,
    about: 'The correlation, vol and gamma position implied by a structure.',
    generate: greekDirection,
  },
  {
    id: 'exotic-stickiness',
    category: 'derivatives',
    subgroup: 'exotic',
    tier: 4,
    about: 'How a spot move changes ATM vol under each stickiness convention.',
    generate: stickiness,
  },
  {
    id: 'exotic-hedgeability',
    category: 'derivatives',
    subgroup: 'exotic',
    tier: 3,
    about: 'Which risks can be hedged on-exchange in Asia, and which cannot.',
    generate: hedgeability,
  },
  {
    id: 'exotic-convention',
    category: 'derivatives',
    subgroup: 'exotic',
    tier: 3,
    about: 'Averaging, fixing and delta conventions as sources of risk.',
    generate: convention,
  },
  {
    id: 'exotic-where-sold',
    category: 'derivatives',
    subgroup: 'exotic',
    tier: 2,
    about: 'Which structured products dominate each Asian market.',
    generate: whereSold,
  },
];
