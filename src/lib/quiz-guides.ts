/**
 * Written briefs for each group and quiz.
 *
 * This is the site's copy layer: the landing page, the group pages and the quiz
 * pages all read from here, so a quiz cannot appear in one place with a
 * description and in another as a bare link. It is deliberately separate from
 * the generator registry — `about` on a generator is a maintainer note ("Gamma
 * PnL from a gamma quoted per 1 percentage point"), whereas `purpose` below is
 * what a trader reads before starting.
 *
 * Every field answers a question a first-time visitor actually has:
 *
 *   purpose      What is being tested, in one line.
 *   whyItMatters The desk problem this drill exists for. Without this the site
 *                is a quiz; with it, it is training.
 *   method       The formula or convention to hold in your head. Shown BEFORE
 *                the first question, because attempting a drill you have not
 *                been briefed on tests memory, not skill.
 *   anchor       The one-line rule worth memorising.
 *   minutes      Rough time for a focused pass. Used on the landing page so a
 *                reader can pick something that fits the gap they have.
 *   terms        Glossary ids used by this quiz, rendered as a term strip.
 *   manualPath   The manual section that covers the background in full.
 */
import { QUIZZES, type Category, type Subgroup } from './types';

export interface GroupGuide {
  purpose: string;
  whyItMatters: string;
  /** What a pass through the group should leave you able to do. */
  outcome: string;
  manualPath: string;
}

export interface QuizGuide {
  purpose: string;
  /** A short trader-facing description of what the drill tests. */
  whatThisTests: string;
  whyItMatters: string;
  method: string;
  anchor: string;
  minutes: number;
  terms: string[];
  manualPath: string;
}

export const GROUP_GUIDES: Record<Category, GroupGuide> = {
  math: {
    purpose: 'Calculator-free arithmetic: Greeks, FX, basis points, forwards and vol.',
    whyItMatters:
      'Almost every number a trader is asked for on the spot is a small multiplication or division under time pressure: what is 1bp on this notional, what is the gamma PnL on a 4% move, where does a 25-delta strike sit. Getting these wrong is not a knowledge failure, it is a fluency failure, and fluency only comes from repetition.',
    outcome:
      'Produce a defensible number in a few seconds, state its unit correctly, and know the order of magnitude before computing.',
    manualPath: 'manual/math',
  },
  markets: {
    purpose: 'Microstructure, ticker recall and market knowledge for HK, JP, SG and AU.',
    whyItMatters:
      'What a trade costs and when it settles is decided by rules, not by your model: session windows, auction mechanics, stamp duty, clearing arrangements and whether a name has a listed hedge at all. An exotic book that ignores these carries costs and risks that never appear in a pricer.',
    outcome:
      'Answer session, cost and access questions from memory, and know which venue trades which leg when.',
    manualPath: 'manual/markets',
  },
  derivatives: {
    purpose: 'Listed contracts and the OTC exotics sold on top of them.',
    whyItMatters:
      'This is the desk. Asian exotic flow is sold as retail and private-bank structured products, priced off a dealer-controlled surface and hedged with a narrow set of listed index futures. The trader who knows the payoff, the convention and what can actually be hedged is the one who can price and defend a mark.',
    outcome:
      'Identify a structure from its mechanics, state its Greeks and convention, and say where each risk is hedged.',
    manualPath: 'manual/exotics',
  },
};

export const QUIZ_GUIDES: Record<Subgroup, QuizGuide> = {
  greeks: {
    purpose: 'Estimate delta, gamma, vega and theta PnL from a move.',
    whatThisTests:
      'This drill tests whether you can turn delta, gamma, vega and theta into a coherent PnL attribution while keeping each quotation convention and time unit straight. It moves from individual Greek calculations to a full overnight explanation, including the distinction between the linear delta term and the quadratic gamma term.',
    whyItMatters:
      'Overnight PnL attribution is the first thing asked for in the morning, and the usual error is not the algebra but the unit: gamma quoted per 1% versus per 1.00 of spot differs by a factor of a hundred. This drill exists to make that convention automatic.',
    method:
      'Gamma PnL = ½ × Γ × (move)², with the move expressed in the same units the gamma is quoted in. Delta PnL is the linear term Δ × move. Vega PnL is vega × change in vol points. Theta is quoted per day, so multiply by the number of days held.',
    anchor:
      'Write the unit next to the Greek before you compute. Most wrong answers on a desk are right arithmetic in the wrong convention.',
    minutes: 5,
    terms: ['gamma', 'delta', 'vega', 'theta', 'pp'],
    manualPath: 'manual/math',
  },
  'put-call-parity': {
    purpose: 'Solve for whichever leg of parity is missing, to the penny.',
    whatThisTests:
      'This drill tests whether you can rearrange put-call parity for any missing leg without losing the financing term or producing an impossible option value. The questions are marked to the penny because parity is a direct no-arbitrage check rather than an estimate.',
    whyItMatters:
      'Parity is the no-arbitrage relationship between a call, a put, the stock and the financing leg. A desk that misprices it is arbitrageable, and a trader who cannot rearrange it in their head cannot check a quote they have just been given.',
    method:
      'Call − Put = Stock − Strike − Carry, where the carry term is the reversal or conversion cost of financing the replicating position. Given four of the five values, rearrange for the fifth. This version is the competitive one: fifteen questions, one hidden leg each time, marked at 0.01 tolerance.',
    anchor:
      'Call = (Stock − Strike) + Put + carry. Positive carry is a conversion, negative is a reversal.',
    minutes: 8,
    terms: ['parity', 'revcon', 'conversion', 'reversal'],
    manualPath: 'manual/math',
  },
  'basis-points': {
    purpose: 'Convert between basis points and money, in either direction.',
    whatThisTests:
      'This drill tests whether you can convert a basis-point charge or PnL into money and back again, while distinguishing a basis point of notional from a basis point of price. It also checks that you can carry the conversion through an index point value when the quoted move is not already a cash amount.',
    whyItMatters:
      'This is the most-used mental calculation on a floor — what is 1bp on this notional, and what does a 3bp spread cost on this trade. It is also where a notional basis point and a price basis point get confused, which is a real and expensive mistake.',
    method:
      'Money = Notional × bp ÷ 10,000. Reverse it as bp = Money ÷ Notional × 10,000. A basis point of notional is a cost; a basis point of price is a move. The question always says which one is meant.',
    anchor:
      '1bp on USD 1m is 100. The relationship is linear in notional, so one row of the ladder gets you the rest.',
    minutes: 4,
    terms: ['bp', 'notional'],
    manualPath: 'manual/math',
  },
  fx: {
    purpose: 'Convert amounts and derive cross rates at a supplied rate.',
    whatThisTests:
      'This drill tests whether you can move an amount through an FX quote in the correct direction, derive a cross rate from two USD legs and value a pip on a stated notional. The two-way-price questions make the instruction explicit so that the task is direction and units, not guesswork about the market convention.',
    whyItMatters:
      'Every regional structure has an FX leg, and the two routine errors are dividing instead of multiplying and getting the triangle the wrong way round. Both produce plausible-looking numbers that are wrong by the ratio of the pair.',
    method:
      'For a USD/XXX quote, multiply a USD amount by the rate to get XXX. Triangulate a cross from two USD legs by putting the leg whose currency you want on top. Rates are always supplied, so the drill tests direction rather than recall.',
    anchor:
      'Write the units out before touching the calculator. If the units cancel to what you were asked for, the direction is right.',
    minutes: 4,
    terms: ['pip', 'cross-rate', 'cnh'],
    manualPath: 'manual/math',
  },
  forwards: {
    purpose: 'Derive forward rates, interpret forward points, and cost a roll.',
    whatThisTests:
      'This drill tests whether you can derive a forward from spot and the interest-rate differential, identify the premium or discount, and translate forward points into the money cost of rolling a hedge. It treats points as a carry outcome that affects PnL, not as an isolated price quotation.',
    whyItMatters:
      'A forward is spot plus the interest-rate differential, and the points are a cost the desk pays or receives whenever a hedge is rolled. Misreading the direction of forward points turns a known cost into an unexplained PnL.',
    method:
      'F = S × (1 + r_quote × t) ÷ (1 + r_base × t), or F = S·e^((r_quote − r_base)t) continuously. Forward points are F − S. The lower-yielding currency trades at a forward premium.',
    anchor:
      'The higher-yielding currency trades at a forward discount. Points are paid away by whoever holds the higher-yielding leg.',
    minutes: 5,
    terms: ['forward-points', 'cip', 'tenor'],
    manualPath: 'manual/math',
  },
  vol: {
    purpose: 'Convert vol to money and price, and place a strike from its delta.',
    whatThisTests:
      'This drill tests the arithmetic that connects volatility to money: vega PnL, price moves expressed in vol points, delta-based strike placement, breakeven volatility and forward volatility. It also tests whether you can value a difference between two volatility surfaces as a basis rather than treating it as a qualitative label.',
    whyItMatters:
      'Strike selection, vega PnL and breakeven all reduce to the same arithmetic, and it is asked at interview far more often than gamma PnL. The 25-delta strike is quotable without a model if you know the relationship.',
    method:
      'Vega PnL = vega × Δvol. A price move of x% at k vol is about x/k vol points. K ≈ S·exp(±Φ⁻¹(Δ)·σ√T), with Φ⁻¹(0.25) ≈ 0.67 and Φ⁻¹(0.10) ≈ 1.28. Breakeven vol is √(2Θ/Γ).',
    anchor:
      'One vol point is one percent of annualised vol. At 20 vol a 1% move is about 5 vol points, and a 25-delta strike sits about 0.67σ√T from spot.',
    minutes: 6,
    terms: ['vega', 'delta', 'breakeven-vol', 'forward-vol', 'vol-point'],
    manualPath: 'manual/math',
  },
  microstructure: {
    purpose: 'Session times, auction phases, clearing, settlement, transaction taxes and all-in cost.',
    whatThisTests:
      'This drill tests whether you can place the Asian venues on a common SGT clock and recall the rules that determine when a hedge can trade, how it clears and what it costs. It combines session and auction sequencing with stamp duty, margining and an all-in round-trip cost calculation.',
    whyItMatters:
      'The session window decides when a barrier or fixing can be observed and when a hedge can be adjusted, and the clearing arrangement decides how much funding the hedge consumes. The round-trip cost is the number that decides whether a hedge is worth doing at all in cash.',
    method:
      'Learn the four venues as a table in SGT: JPX first to open and first to close, then SGX, then HKEX; SGX closes last. Then layer the auction phases, the clearing house and the stamp-duty position for each. For cost, remember that fees are paid per side while the spread is crossed once.',
    anchor:
      'Opens: JPX, SGX, HKEX. Closes: JPX, HKEX, SGX. Only Hong Kong charges stamp duty on exchange trades — 20bp a round trip.',
    minutes: 6,
    terms: ['cas', 'tac', 'sq', 'dvp', 'ccp', 'stamp-duty', 'iep'],
    manualPath: 'manual/markets',
  },
  tickers: {
    purpose: 'Ticker to name, sector, size, index membership, liquidity and hedgeability.',
    whatThisTests:
      'This drill tests whether a ticker becomes a usable desk fact rather than a memorised code: name, sector, market-cap band, index membership, turnover band and hedgeability. Its final arithmetic questions connect liquidity to execution by asking how long a position takes to unwind at a stated share of turnover.',
    whyItMatters:
      'Asian names trade under numeric-looking codes, and the codes are not mnemonics. More importantly, the last two levels are the ones that matter for an exotic book: a name that looks large may be impossible to hedge at size, because there is no listed single-stock derivative, borrow is hard, and unwinding takes longer than the hedge can wait.',
    method:
      'Build outward from the code: name, then sector, then market-cap band, then index membership, then average daily turnover, then what listed hedge exists, then days to unwind. Market cap and liquidity are separate questions and the second is the one that decides whether a trade is possible. Days to unwind is position divided by turnover times participation.',
    anchor:
      'In Singapore the top thirty names are about two thirds of market cap and three quarters of traded value. If a name is not in that set, assume you cannot hedge it at size.',
    minutes: 6,
    terms: ['adt', 'sti', 'reit', 'borrow'],
    manualPath: 'manual/markets',
  },
  'market-knowledge': {
    purpose: 'Holiday calendars, access channels, central banks and index construction.',
    whatThisTests:
      'This drill tests the market facts that change how an Asian structure is observed, accessed and hedged: holidays, Stock Connect and QFII, share classes, central-bank operating frameworks and index construction. It finishes by turning the policy-rate distinction into the percentage-point differential that drives forward points.',
    whyItMatters:
      'The Asian trading calendar is not one calendar. Lunar holidays move every year, access to mainland shares depends on which channel you are using, and the regional central banks do not all target an interest rate — Singapore targets the currency. Each of these changes when a structure can be observed, what it is worth, and what a hedge costs to roll.',
    method:
      'Fix the calendar per market and note which holidays are lunar. Fix the access route per market: Stock Connect north and south, QFII, and the fact that H and A shares are not fungible. Fix the policy instrument per central bank: rate for the Fed, RBA and BOJ; currency band for MAS; administered rates for the PBoC. Then convert: the forward points follow the differential, not either rate alone.',
    anchor:
      'Lunar holidays move, so look them up. H and A shares are not fungible, so check which one your fixing references. MAS manages the currency, not the rate — and the rate differential, not either leg, sets the forward points.',
    minutes: 5,
    terms: ['stock-connect', 'qfii', 'h-share', 'a-share', 'neer', 'mlf', 'lpr'],
    manualPath: 'manual/markets',
  },
  listed: {
    purpose: 'Contract specification, notional, expiry convention and venue.',
    whatThisTests:
      'This drill tests whether you can read an index futures specification as a hedge: point value, contract notional, expiry convention and venue. The calculations are deliberately operational, because a wrong multiplier or roll date changes the hedge size even when the directional view is right.',
    whyItMatters:
      'The index future is the only genuinely liquid hedge leg in the region, so its specification is the unit of every hedge calculation. Notional decides the lot count, the expiry convention decides when the hedge rolls, and the offshore listing decides whether the hedge trades when the home market is shut.',
    method:
      'Point value × index level = notional. Money = points × multiplier × lots. Expiry: Japan second Friday (SQ), Hong Kong the business day before the last business day, A50 the last business day, ASX the third Thursday.',
    anchor:
      'Know the point value of the contract you hedge with. Everything else in the hedge calculation is a multiple of it.',
    minutes: 4,
    terms: ['sq', 'point-value', 'notional', 'gift-nifty'],
    manualPath: 'manual/listed',
  },
  exotic: {
    purpose: 'Payoffs, Greeks, stickiness conventions and what can be hedged.',
    whatThisTests:
      'This drill tests whether you can identify an exotic structure from its payoff mechanics, infer the correlation, volatility and gamma risks, and state which parts can be hedged in listed markets. It also checks the conventions that change a mark in practice: averaging, fixing, delta definition and the chosen sticky-surface assumption.',
    whyItMatters:
      'This is the core of the desk. The structures are sold as retail products, priced off a dealer-controlled surface, and hedged with a narrow set of listed futures plus an opaque borrow market. The trader who cannot classify a term sheet by its mechanics cannot price it or defend the mark.',
    method:
      'Classify by mechanics, not by name: does it autocall, is the coupon conditional, is downside leveraged, is the barrier reset, does the payoff average. Then state the Greeks position and ask which part of it has a listed hedge. The sticky convention must be stated before arguing about a mark.',
    anchor:
      'Index delta is the only clean on-exchange hedge. Single-name delta is borrow or OTC, single-name vega and gamma are OTC, correlation has no listed product, and only the Nikkei has a listed dividend leg.',
    minutes: 10,
    terms: ['ko', 'ki', 'autocall', 'snowball', 'accumulator', 'cliquet', 'worst-of', 'reset-barrier', 'sticky-strike', 'sticky-delta', 'sticky-local-vol', 'dispersion', 'quanto'],
    manualPath: 'manual/exotics',
  },
  'vol-surface': {
    purpose: 'The shape of the surface: skew, term structure and cross-market basis.',
    whatThisTests:
      'This drill tests whether you can read the shape of an Asian volatility surface: skew direction, term structure and the basis between venues for the same underlying. It then turns the wing premium into a money amount through vega, keeping the surface description tied to the mark.',
    whyItMatters:
      'The surface is what the desk prices off, and its shape is stable enough to be learnt even though its level is not. Skew direction, which part of the curve a structure marks to, and the vol basis between two venues for the same underlying are the three things that decide a mark — and the skew is a money number, not only a direction.',
    method:
      'Asian index skew slopes down: puts are richer than calls. Skew in vol points is the wing vol minus ATM; in money it is vega times that difference. A cliquet marks to forward vol, not spot. Where the same underlying trades in two venues, there are two surfaces and the difference is a quotable basis.',
    anchor:
      'Vol levels move; the shape does not. Learn the shape, then read the level off the market — and remember the skew is worth vega times the wing premium.',
    minutes: 4,
    terms: ['skew', 'term-structure', 'forward-vol', 'vol-basis'],
    manualPath: 'manual/exotics',
  },
};

/** The guide for a quiz. Total by construction, so a page can never render blank. */
export function guideFor(subgroup: Subgroup): QuizGuide {
  return QUIZ_GUIDES[subgroup];
}

/**
 * Minutes to work through every quiz in a group, ignoring the daily set. Used on
 * the landing page so a reader can pick a group that fits the gap they have.
 */
export function groupMinutes(category: Category): number {
  return QUIZZES.filter((q) => q.category === category).reduce(
    (total, q) => total + QUIZ_GUIDES[q.subgroup].minutes,
    0,
  );
}
