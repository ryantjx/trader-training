/**
 * Asia exotic options (Manual, Exotic options).
 *
 * The core of the desk, and the content the rest of the manual serves. These
 * generators test the things an exotics trader has to know reflexively: which
 * structure a term sheet describes, which way the Greeks point, what the
 * stickiness convention does to the mark, and — the README's central point —
 * what can and cannot be hedged on-exchange.
 */
import type { ChoiceOption, ChoiceQuestion, Generator, Rng } from '../types';

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
    where: 'Hong Kong, Japan and Singapore retail and private-bank flow',
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
    traits: 'The mirror of an accumulator: sells a fixed quantity each day while the price is inside a range, with the downside leveraged against the seller.',
    greeks: 'Short gamma and short vol, mirrored',
    where: 'Hong Kong',
  },
  {
    id: 'reset-barrier',
    name: 'Reset barrier option',
    traits:
      'A knock-in or knock-out whose barrier is RE-FIXED on a reset date if it has been breached, so the option does not die. Trigger depends on the reset schedule and rule.',
    greeks: 'The reset introduces a forward-starting barrier exposure, so delta is discontinuous at both the barrier and the reset',
    where: "Hong Kong retail structures, and the wider Asian retail book — Asia's distinguishing barrier convention",
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
    where: 'Institutional flow in Japan, Hong Kong and Singapore — hard to run in Asia because single-name vol is OTC only',
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

function identifyStructure(rng: Rng): ChoiceQuestion {
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
    prompt: `A term sheet describes the following. Which structure is it?\n\n${target.traits}`,
    context: 'Identify the structure from the payoff mechanics, not from the marketing name.',
    explain: `This is a ${target.name}. Greeks: ${target.greeks}. Sold mainly in: ${target.where}.`,
    anchor: 'Classify by payoff mechanics: does it autocall, is the coupon conditional, is the downside leveraged, is the barrier reset? That gives the structure and the hedge.',
    citation: 'Manual, Exotic options, the payoffs to know by heart',
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

function greekDirection(rng: Rng): ChoiceQuestion {
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
        'Well above the knock-in the structure behaves like a short knock-in put, which leaves the seller long gamma on the upside path and short gamma once spot approaches the knock-in. Crossing the knock-in flips the sign: above it the desk benefits from movement, below it the desk is hurt by it. The sign flip around the knock-in is the defining feature of the position.',
      anchor: 'Gamma flips sign around the knock-in level. That is where the hedge has to be watched most closely.',
    },
    {
      id: 'reverse-dispersion',
      prompt: 'You have sold a dispersion trade: short single-name vol, long index vol. What is your correlation position?',
      answerId: 'long-corr',
      explain:
        'Selling dispersion means you are long correlation. The position loses when names diverge and gains when they move together, which is the opposite of the standard long-dispersion book. It is the trade a desk uses to lay off correlation it has accumulated from worst-of flow.',
      anchor: 'Long dispersion is short correlation. Short dispersion is long correlation. The sign is the whole trade.',
    },
    {
      id: 'range-accrual',
      prompt: 'You have sold a range accrual. What is your gamma position while spot sits inside the range?',
      answerId: 'short-gamma',
      explain:
        'A range accrual stops accruing the moment the underlying fixes outside the range, so the coupon is a series of digitals. Selling it is short gamma around the range boundaries: movement toward an edge costs money, and movement inside the range earns nothing extra.',
      anchor: 'Range accruals are short gamma at the boundaries. The fixing convention decides exactly where those boundaries bite.',
    },
    {
      id: 'one-touch-sold',
      prompt: 'You have sold a one-touch. What is your gamma position as spot approaches the barrier?',
      answerId: 'short-gamma',
      explain:
        'A sold one-touch is a short digital: the payoff flips to a fixed amount the instant the barrier is touched. That makes gamma very large and negative near the barrier, because a small move can change the payoff from nothing to the full amount.',
      anchor: 'A sold one-touch is short gamma into the barrier, and the gamma grows as the barrier gets closer.',
    },
    {
      id: 'autocall-bought',
      prompt: 'You have BOUGHT an autocallable from a dealer. What is your gamma position near the autocall level?',
      answerId: 'short-gamma',
      explain:
        'A bought autocallable redeems at par once the autocall level is met, so its upside is capped exactly where the structure terminates. Approaching the autocall level from below, the holder is short gamma: further upside does not accrue, so the position stops benefiting from movement.',
      anchor: 'The buyer of an autocallable is short gamma into the autocall level. The seller is the mirror.',
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
    prompt: item.prompt,
    context: 'Reason from the payoff, not from a memorised position.',
    explain: item.explain,
    anchor:
      'Worst-of: short correlation. Cliquet: long forward vol. Accumulator sold: short gamma. Autocallable: gamma flips at the knock-in.',
    citation: 'Manual, Exotic options',
    signature: `exotics|greeks-${item.id}`,
    options: rng.shuffle([{ ...answerOption, id: 'right' }, ...distractorIds.map((g, i) => ({ ...g, id: `w${i}` }))]),
    answerId: 'right',
  };
}

function stickiness(rng: Rng): ChoiceQuestion {
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
    {
      id: 'sticky-strike-rally',
      prompt:
        'Spot RALLIES 5%. Under the sticky-STRIKE convention, what happens to ATM implied vol?',
      answerId: 'falls',
      explain:
        'Sticky-strike holds the surface fixed against strikes, so the new at-the-money point is a LOWER strike than the old one. With downward-sloping skew, a lower strike carries lower vol, so ATM vol falls. The surface does not move; spot walks down the skew as it rallies.',
      anchor: 'Sticky-strike: ATM vol moves OPPOSITE the direction of spot, because the surface does not move. Down-skew means a rally lowers ATM vol.',
    },
    {
      id: 'skew-flattening',
      prompt:
        'The index rallies 3% and the desk re-marks on sticky-strike. Your book is long downside puts. What happens to the mark of the puts?',
      answerId: 'falls',
      explain:
        'On sticky-strike the surface does not move, so the puts stay marked at their fixed strikes. But spot has risen, so those strikes are now further out of the money and the puts lose value on delta. The vol at each strike is unchanged; the moneyness of the puts is not.',
      anchor: 'Sticky-strike means strikes keep their vol, so a rally cheapens downside puts through moneyness rather than through vol.',
    },
    {
      id: 'sticky-local-vol-rally',
      prompt:
        'Spot rallies 5% on a barrier book marked on sticky-LOCAL-VOL. What happens to the implied vol at a fixed barrier level below spot?',
      answerId: 'unchanged',
      explain:
        'Sticky-local-vol attaches vol to a fixed spot LEVEL, so the vol quoted at that barrier level does not change when spot moves elsewhere. The skew slides through the fixed strikes, but the level-referenced vol is unchanged. This is why the convention suits barrier books.',
      anchor: 'Sticky-local-vol attaches vol to a spot level, so a barrier keeps its vol as spot moves. The skew slides; the level does not.',
    },
    {
      id: 'sticky-delta-skew-rotation',
      prompt:
        'Under sticky-DELTA, spot falls 5% and the desk re-marks. What happens to the vol of the FIXED 25-delta put?',
      answerId: 'unchanged',
      explain:
        'Sticky-delta anchors the smile to delta, so the 25-delta put keeps the same vol before and after the move. What changes is the STRIKE at which that 25-delta sits: it is now lower in absolute terms. The vol by delta is constant; the vol by strike is not.',
      anchor: 'Sticky-delta: vol by delta is constant, vol by strike is not. Sticky-strike is the mirror image.',
    },
    {
      id: 'sticky-local-vol-atm',
      prompt:
        'Spot falls 5% on a book marked sticky-LOCAL-VOL. What happens to ATM implied vol?',
      answerId: 'rises',
      explain:
        'Sticky-local-vol holds vol fixed at each spot LEVEL. As spot falls, the new at-the-money level is a lower level, and on a downward-sloping surface the lower level carries HIGHER vol. So ATM vol rises even though no vol at any given level changed. This is the case that catches people out.',
      anchor: 'Sticky-local-vol moves ATM vol with spot, because ATM is a level. Sticky-delta does not, because ATM is a delta.',
    },
    {
      id: 'sticky-strike-put-wing',
      prompt:
        'Under sticky-STRIKE, spot falls 5%. What happens to the vol of a FIXED out-of-the-money put?',
      answerId: 'unchanged',
      explain:
        'That is the definition of sticky-strike: a fixed strike keeps its vol, whatever spot does. The put becomes closer to the money and gains value on delta, but its implied vol is unchanged. Confusing this with the ATM vol, which does move, is the common error.',
      anchor: 'Under sticky-strike a fixed strike keeps its vol. Only the ATM point moves, because only the ATM point changes strike.',
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
    prompt: item.prompt,
    context: 'Asian index skew is pronounced, with puts trading rich to calls.',
    explain: item.explain,
    anchor: 'Know which convention the book is marked on before arguing about a mark. The same position marks differently under each.',
    citation: 'Manual, Exotic options, the volatility surface',
    signature: `exotics|stickiness-${item.id}`,
    options: directionOptions,
    answerId: item.answerId,
    // Not shuffled: rises/falls/unchanged reads as a natural three-way scale.
  };
}

function hedgeability(rng: Rng): ChoiceQuestion {
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
      prompt: 'Where do you hedge the correlation on a dispersion book in Asian single names?',
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
    {
      id: 'single-stock-delta',
      prompt: 'You are long delta on a Hong Kong single name through a barrier structure. Where do you hedge the delta?',
      answerId: 'borrow',
      explain:
        'HKEX lists stock options and futures, but the structure you sold is hedged in the underlying, so the leg is stock borrow or an OTC total-return swap rather than a listed option. Borrow is the binding constraint: where it is hard, the delta hedge becomes a funding problem as well as a market one.',
      anchor: 'Single-name delta is a borrow problem first and a market problem second. Check the borrow before sizing the trade.',
    },
    {
      id: 'index-gamma',
      prompt: 'You are short gamma on an HSI book and want to lay some off on-exchange. Where is that available?',
      answerId: 'listed',
      explain:
        'HKFE lists HSI index options, and the front-tenor near-the-money strikes are the liquid part. Index gamma is therefore hedgeable on-exchange in Hong Kong, unlike single-name gamma. Liquidity falls away quickly in the wings and the back tenors.',
      anchor: 'Index gamma is listed and liquid near the money in the front tenors. The wings and the back of the curve are not.',
    },
    {
      id: 'stock-vega',
      prompt: 'You need to lay off single-name vega on a Japanese bank stock. What is available?',
      answerId: 'otc',
      explain:
        'JPX does list single-stock derivatives domestically, so there is a listed leg in Japan that does not exist on SGX or HKEX. In practice the structured-product vega is still sourced OTC, because the listed strikes and tenors rarely match the structure and the size is not there.',
      anchor: 'Japan is the exception: it lists single-stock derivatives. Even so, the vol for a structured product usually goes OTC.',
    },
    {
      id: 'barrier-reset',
      prompt: 'You have sold a reset barrier on a Hong Kong name. Where do you hedge the reset risk?',
      answerId: 'nothing',
      explain:
        'A reset barrier cannot be hedged statically: the position changes after a reset date and a plain listed option does not replicate that. The desk hedges the delta and gamma dynamically with the underlying and index futures, and carries the reset exposure until it can be offset OTC.',
      anchor: 'A reset or window barrier has no static listed hedge. Hedge the Greeks dynamically and carry the reset risk.',
    },
    {
      id: 'dispersion-gamma',
      prompt: 'You are running an Asian dispersion book. Where do you hedge the index gamma?',
      answerId: 'listed',
      explain:
        'The index leg of a dispersion trade is the one part that is directly hedgeable: index options or futures on the relevant exchange cover it. The single-name legs are the problem, because their vol must be sourced OTC. That asymmetry is why Asian dispersion is hard to run at size.',
      anchor: 'In dispersion the index leg is listed and the single-name legs are OTC. The hedgeability is asymmetric.',
    },
  ] as const;

  const answers: Record<string, ChoiceOption> = {
    otc: { id: 'otc', label: 'OTC only, dealer to dealer' },
    listed: { id: 'listed', label: 'On-exchange index futures or options' },
    nothing: { id: 'nothing', label: 'No listed or clean hedge exists' },
    partial: { id: 'partial', label: 'Partly listed FX, the rest OTC' },
    borrow: { id: 'borrow', label: 'Stock borrow or an OTC total-return swap' },
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
    prompt: item.prompt,
    context:
      'SGX and HKEX list no single-stock options and no single-stock futures. JPX does list single-stock derivatives domestically.',
    explain: item.explain,
    anchor: 'Index delta: listed. Single-name delta: borrow or OTC. Single-name vega and gamma: OTC. Correlation: nothing. Dividends: only the Nikkei.',
    citation: 'Manual, Exotic options, the Asia exotics hedge gap',
    signature: `exotics|hedgeability-${item.id}`,
    options: rng.shuffle([
      { ...correct, id: 'right' },
      ...others.map((o, i) => ({ ...o, id: `w${i}` })),
    ]),
    answerId: 'right',
  };
}

function convention(rng: Rng): ChoiceQuestion {
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
        'Why do Asian structures reference an observation inside a protected window rather than the raw close?',
      answerId: 'gameproof',
      explain:
        'The trading window exists so that a barrier or a fixing cannot be gamed in a thin hour. Hong Kong has the CAS closing window, SGX has Trade at Close, and the ASX has a closing auction. The window changes both the observation price and the hedging opportunity.',
      anchor: 'Trading windows protect a fixing or barrier from being gamed. Know which window the structure references.',
    },
    {
      id: 'delta-convention',
      prompt:
        'Two desks quote "the 25-delta put" on the same single stock and give different strikes. What is the most likely cause?',
      answerId: 'convention',
      explain:
        'Spot delta, forward delta and driftless delta are all standard, and driftless delta is the common single-stock convention in parts of Asia. For a call, spot and forward delta differ by the discount factor, and a driftless delta strips out the rate and dividend drift. The same "25-delta" therefore maps to three different strikes. An exotic\'s mark moves if the convention is changed after the trade.',
      anchor: 'Spot, forward and driftless delta are all in use. Establish the convention before comparing a strike to another desk.',
    },
    {
      id: 'observation-timing',
      prompt: 'A note observes the close on 15 March, which is a market holiday. What does the term sheet usually specify?',
      answerId: 'postpone',
      explain:
        'The standard convention is to postpone to the next business day, then determine the price from that close. The alternative — averaging the surrounding days, or using a dealer poll — must be written into the term sheet. Getting this wrong moves the observation date and can change whether a barrier was breached.',
      anchor: 'A holiday shifts the observation; it does not cancel it. Read the fallback clause before pricing the date.',
    },
    {
      id: 'averaging-type',
      prompt: 'A structure pays on an arithmetic average of daily closes. What is the main reason the desk prefers to price it against a geometric average?',
      answerId: 'convention',
      explain:
        'A geometric average has a closed-form solution under the standard model; an arithmetic average does not, so it needs a moment-matching or simulation adjustment. The two averages differ in value by roughly half the variance, which is why the averaging type is a pricing input rather than a documentation detail.',
      anchor: 'Arithmetic versus geometric averaging is a pricing input, not a formality. The gap is about half the variance.',
    },
    {
      id: 'disruption-fallback',
      prompt: 'A market disruption event prevents an observation. What is the standard first response?',
      answerId: 'postpone',
      explain:
        'The usual cascade is to postpone the observation, then to determine the price by dealer poll if the disruption persists. Increased cost of hedging and change in law are separate clauses with their own fallbacks. Knowing the cascade matters because it decides who bears the risk of a missed fixing.',
      anchor: 'Disruption postpones first, dealer poll second. Know the cascade before the event, not after.',
    },
    {
      id: 'barrier-reset-schedule',
      prompt: 'A reset barrier has been breached. What does the term sheet decide at that point?',
      answerId: 'postpone',
      explain:
        'A reset barrier does not die on a breach: it is re-fixed on the reset date according to the schedule and reset rule in the term sheet. The trader has to know both the schedule and the rule, because the position after a reset is a different barrier exposure from the one that was priced.',
      anchor: 'A reset re-fixes the barrier rather than killing it. The schedule and the reset rule are part of the trade.',
    },
  ] as const;

  const answers: Record<string, ChoiceOption> = {
    asian: { id: 'asian', label: 'An average-rate (Asian) option' },
    basis: { id: 'basis', label: 'A cross-market basis between the H-share and the A-share' },
    gameproof: { id: 'gameproof', label: 'To stop the fixing or barrier being gamed in a thin hour' },
    convention: { id: 'convention', label: 'A pricing or delta convention that differs between the two desks' },
    postpone: { id: 'postpone', label: 'Postpone the observation to the next business day, then poll dealers if needed' },
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
    prompt: item.prompt,
    context: 'Observation, averaging and fixing conventions determine the payoff and are a common source of disputes.',
    explain: item.explain,
    anchor: 'Conventions are where mispricing and disputes originate. Read the fixing and averaging definitions before pricing.',
    citation: 'Manual, Exotic options',
    signature: `exotics|convention-${item.id}`,
    options: rng.shuffle([
      { ...correct, id: 'right' },
      ...others.map((o, i) => ({ ...o, id: `w${i}` })),
    ]),
    answerId: 'right',
  };
}

function whereSold(rng: Rng): ChoiceQuestion {
  const map = [
    { market: 'China', product: 'Snowballs, autocallables and fixed-coupon notes' },
    { market: 'Hong Kong', product: 'Accumulators, CBBCs and derivative warrants' },
    { market: 'Japan', product: 'Nikkei-linked autocallables, cliquets and FX structures' },
    { market: 'Singapore', product: 'Index autocallables and total-return swaps sold to private banks' },
    { market: 'Taiwan', product: 'Worst-of autocallables and principal-protected notes' },
    { market: 'China', product: 'Phoenix structures with a conditional coupon barrier' },
    { market: 'Hong Kong', product: 'Reset-barrier notes on H-share underlyings' },
    { market: 'Japan', product: 'Range accruals and dual-currency deposits' },
  ];

  const target = rng.pick(map);
  const others = rng.sample(map.filter((m) => m.market !== target.market), 3);

  // Two directions over the same facts: which products dominate a market, and
  // which market a product dominates. Both are useful recall, and the second
  // direction stops the drill from being a five-item lookup.
  const angle = rng.pick(['market-to-product', 'product-to-market'] as const);

  if (angle === 'product-to-market') {
    const markets = [...new Set(map.map((m) => m.market))];
    const distractorMarkets = rng.sample(markets.filter((m) => m !== target.market), 3);
    return {
      kind: 'choice',
      id: `exo-${rng.int(0, 1_000_000).toString(36)}`,
      generatorId: 'exotic-where-sold',
      category: 'derivatives',
      subgroup: 'exotic',
      prompt: `In which market is "${target.product}" a dominant retail structure?`,
      context: 'Retail appetite differs by market and drives what the desk is asked to price.',
      explain: `That is the ${target.market} retail market. ${target.market}: ${target.product}. Distribution differs too: Hong Kong reaches retail through brokers, Japan through retail brokers and structured notes, and Singapore through the private-bank channel.`,
      anchor: 'The commercial map matters: it tells you which structures you will be asked for, and through which channel.',
      citation: 'Manual, Exotic options, where each product is sold',
      signature: `exotics|where-sold-reverse-${target.market.toLowerCase()}-${target.product.length}`,
      options: rng.shuffle([
        { id: 'right', label: target.market },
        ...distractorMarkets.map((m, i) => ({ id: `w${i}`, label: m })),
      ]),
      answerId: 'right',
    };
  }

  return {
    kind: 'choice',
    id: `exo-${rng.int(0, 1_000_000).toString(36)}`,
    generatorId: 'exotic-where-sold',
    category: 'derivatives',
    subgroup: 'exotic',
    prompt: `Which structured products dominate retail flow in ${target.market}?`,
    context: 'Retail appetite differs by market and drives what the desk is asked to price.',
    explain: `${target.market}: ${target.product}. Distribution differs too: Hong Kong reaches retail through brokers, Japan through retail brokers and structured notes, and Singapore through the private-bank channel, so tickets are large and the buyer base is narrow.`,
    anchor: 'The commercial map matters: it tells you which structures you will be asked for, and through which channel.',
    citation: 'Manual, Exotic options, where each product is sold',
    signature: `exotics|where-sold-${target.market.toLowerCase()}-${target.product.length}`,
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
    about: 'Identify the exotic structure from its payoff mechanics.',
    generate: identifyStructure,
  },
  {
    id: 'exotic-greeks',
    category: 'derivatives',
    subgroup: 'exotic',
    about: 'The correlation, vol and gamma position implied by a structure.',
    generate: greekDirection,
  },
  {
    id: 'exotic-stickiness',
    category: 'derivatives',
    subgroup: 'exotic',
    about: 'How a spot move changes ATM vol under each stickiness convention.',
    generate: stickiness,
  },
  {
    id: 'exotic-hedgeability',
    category: 'derivatives',
    subgroup: 'exotic',
    about: 'Which risks can be hedged on-exchange in Asia, and which cannot.',
    generate: hedgeability,
  },
  {
    id: 'exotic-convention',
    category: 'derivatives',
    subgroup: 'exotic',
    about: 'Averaging, fixing and delta conventions as sources of risk.',
    generate: convention,
  },
  {
    id: 'exotic-where-sold',
    category: 'derivatives',
    subgroup: 'exotic',
    about: 'Which structured products dominate each Asian market.',
    generate: whereSold,
  },
];
