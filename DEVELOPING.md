# Trader Training

A static website of daily drills for an Asian exotic-options desk: mental math under mild time
pressure, and recall of the market conventions and structures the desk trades.

`README.md` is the design index — what the site is, how it is structured, and the decisions behind it.
The teaching material is published on the site under `src/content/docs/manual/`. This file is the
developer guide: build, routes, tests, deployment.

## Quick start

```bash
npm install
npm run dev        # local dev server
npm test           # vitest
npm run build      # static build into dist/
npm run preview    # serve the built site
```text

Node 22 is pinned in `.nvmrc`.

## How it works

The site is **fully static** and deployed to GitHub Pages. There is no server, no account, and no
network call at any point: not at build time, not at play time. That constraint drives most of the
design below.

### The daily set is a pure function of the date

Twenty questions are assembled in the browser from a date key, so every visitor sees the same
questions today and a score is comparable from one day to the next.

```text
src/lib/seed.ts     quizDateKey() -> "2026-10-17"  (Singapore time)
                    dailySeed() / seedFor() -> integer seeds, via FNV-1a
src/lib/rng.ts      mulberry32(seed) -> Rng
src/lib/daily.ts    buildDailySet(dateKey, tier) -> 20 interleaved questions
```

Two rules make this hold:

1. **No `Math.random()` and no `Date.now()` anywhere in generation.** All randomness flows through
   an `Rng` built from a date-derived seed. There is a comment to this effect in `rng.ts`; treat it
   as load-bearing.
2. **No data fetching.** Levels are frozen in `src/data/*.json` and committed. A live rate would
   break both fairness (two users, different questions) and answerability (recall questions whose
   answers have moved).

### Determinism and transcendentals

`Math.exp`, `Math.pow` and `Math.sqrt` are not guaranteed to agree in the last bit across JS
engines. They are kept rather than engineered around, because every answer is displayed and marked
at 2dp and the quantities involved are order 1e2, so a last-bit difference is many orders of
magnitude too small to change a mark.

The one condition under which that reasoning fails is an answer sitting exactly on a rounding
boundary. `markStable()` in `marking.ts` expresses the condition and the test suite asserts it over
every generator.

The lookup-table alternative for `delta-strike` is documented in the plan and can be added if a
cross-engine discrepancy is ever observed. It is not built.

### Generators

A generator is a pure function, `(rng, tier) => Question`. One file per topic in
`src/lib/generators/`, plus `registry.ts` which is the single source of truth for the daily builder,
the quiz pages, the tests and the About page.

```ts
export const someGenerators: Generator[] = [
  { id: 'unique-id', category: 'math', tier: 2, about: '…', generate: fn },
];
```

Add a generator by writing the function, adding it to the list in its file, and spreading that list
in `registry.ts`. Nothing else needs to change.

A question is one of four kinds, and a renderer switches on it exhaustively:

| `kind` | Answer carried | Marked by |
| --- | --- | --- |
| `numeric` | `answer`, `decimals`, `tolerance` | rounding at `decimals`, or the tolerance band |
| `choice` | `options`, `answerId` | id equality |
| `ordering` | `items`, `answerOrder` | exact sequence |
| `text` | `answer` (canonical), `accept` (all variants) | `markText()` in `marking.ts` |

The `text` kind exists for the ticker naming drill. It folds case, punctuation, ampersands and a
short list of corporate suffixes before comparing, and accepts a one-edit difference only when both
strings are at least eight characters, so a transposition in a long name costs nothing while `DBX`
is still not `DBS`. Every mode resets its input through `initialResponse()` in `responses.ts` — use
it rather than an if-chain, which is how a numeric answer used to leak into a choice question.
`tests/generators.test.ts` asserts every question kind gets a matching empty response and that an
untouched question is never already correct.

### Routes

Every quiz is its own page. The route structure mirrors the sidebar exactly:

```text
/                        Today — the daily set, 20 questions from all three groups
/group/1-math            Math overview: its quizzes, plus a mixed drill
/group/2-markets         Markets overview
/group/3-asia-derivatives  Asia Derivatives overview
/quiz/greeks             one quiz
/quiz/put-call-parity    ...  (12 quiz pages in total)
/quiz/fx /quiz/forwards /quiz/vol /quiz/basis-points
/quiz/microstructure /quiz/tickers /quiz/market-knowledge
/quiz/listed /quiz/exotic /quiz/vol-surface
/manual/                 the manual index
/manual/math             units, Greeks, FX, bp, forwards, vol, parity
/manual/markets          microstructure, tickers, calendars, access
/manual/listed           contract specifications and offshore access
/manual/exotics          payoffs, surface conventions, the hedge gap
/manual/glossary         every abbreviation, rendered from src/lib/glossary.ts
/reference/{sgx,hkex,jpx,asx}   market-structure facts plus a per-venue note
/reference/              cross-venue overview: all four on one SGT clock
/stats /about
```

The numbered group slugs come from `GROUP_SLUGS` in `types.ts`, and the quiz list from
`QUIZZES` in the same file — which is the single source of truth for the sidebar, the routes and
the index on the homepage. Adding a quiz means adding a `Subgroup`, a `SUBGROUP_LABELS` entry, a
`QUIZZES` row, a `QUIZ_GUIDES` entry in `src/lib/quiz-guides.ts`, a sidebar entry in
`astro.config.mjs`, and a `getStaticPaths` row in `src/pages/quiz/[quiz].astro`. A test asserts the
guide exists, so forgetting one fails the build rather than rendering a blank page.

**Build internal links with `url()` from `src/lib/url.ts`, never string concatenation.**
`import.meta.env.BASE_URL` has no trailing slash, so `${base}quiz/fx` yields
`/trader-trainingquiz/fx` — a 404 where the page still renders, which reads as a styling bug.
Astro does **not** prefix `base` into links written in Markdown, so manual pages use relative links
(`../../quiz/greeks`) rather than absolute ones. An absolute `/quiz/greeks` in a `.md` file
will 404 under the project-page prefix.

### The content layer

Three files hold user-facing copy, and none of them are in the generators:

| File | Holds | Read by |
| --- | --- | --- |
| `src/lib/quiz-guides.ts` | `purpose`, `whyItMatters`, `method`, `anchor`, `minutes`, `terms`, `manualPath`, per group and per quiz | the landing page, the group pages, the quiz pages, page meta descriptions |
| `src/lib/glossary.ts` | every abbreviation, with expansion, definition and area | the glossary page, each quiz's term strip, the `Term` component |
| `src/lib/venue-notes.ts` | the per-venue narrative for SGX, HKEX, JPX and ASX | the reference pages |
| `src/lib/sessions.ts` | SGT formatting, offsets, overlaps, open-at-time | the reference pages and the overview |

Keep the distinction: a generator's `about` is a maintainer note ("Gamma PnL from a gamma quoted
per 1 percentage point"), while `purpose` is what a trader reads before starting. The quiz page
shows the second to everyone and keeps the first inside a collapsed details block.

### Session times and timezones

`src/data/sessions.json` carries **both clocks** for every venue: `continuousSgt` /
`marketCloseSgt`, and `continuousLocal` / `marketCloseLocal` with a `timezone` and `utcOffset`.
Local times are the source of truth from the exchange rulebooks; SGT times are the same session on
the desk clock. They are stored rather than derived so that a disagreement is visible, and
`tests/content.test.ts` asserts that local plus offset equals SGT for every open, close and market
close. Do not add a venue with only one clock.

`src/lib/sessions.ts` is the only place that formats or compares them — `formatSessions()`,
`sessionMinutes()`, `localToSgt()`, `overlap()` and `venuesOpenAt()`. The per-venue pages and the
cross-venue overview both read from it, so the two cannot disagree about when a market is open.

**Everything user-facing is in SGT (UTC+8)**, with local time shown alongside and the offset stated
in words. The desk works on one clock; the exchanges do not.

### Authoring the manual

The manual lives in `src/content/docs/manual/` as Markdown, rendered by Starlight with
`remark-math` and `rehype-katex`. Conventions:

- **State the unit before the number.** Almost every drill exists to fix a convention, so the
  convention is the content.
- **Give a worked example** for every formula, with the arithmetic shown.
- **End with `Practise this`** linking the relevant quizzes, using relative links.
- **Do not cite the README.** It is a repository document; a site reader cannot open it. Cite the
  manual section instead.
- **Do not write a bare `$` pair** in prose — it renders as math. Use `USD 100m`, not `$100m`.

### The three groups

Every generator declares exactly one of three categories. The grouping is the same in the README, the
sidebar and the code:

| Category | Contents |
| --- | --- |
| `math` | Greeks, FX, basis points, forwards, vol arithmetic, put-call parity |
| `markets` | Microstructure, tickers, market knowledge |
| `derivatives` | Listed contracts, OTC exotics, vol surface |

This replaced an earlier five-way split in which `derivatives` and `exotics` were separate and
`knowledge` had no obvious home. Two things to know about the merge:

- **Listed contracts and OTC exotics now share `derivatives`.** That distinction matters to the desk,
  so each generator also carries an optional `subgroup` (`listed`, `exotic`, `vol-surface`) and
  `generatorsBySubgroup()` feeds the quiz page's grouped list. Do not drop the subgroup when adding a
  derivatives generator — a test asserts both `listed` and `exotic` survive.
- **The old `knowledge` category was genuinely mixed.** Calendars and access are market content;
  the volatility surface is derivatives content. It was split into `knowledge.ts` and
  `vol-surface.ts` rather than relabelled.
- **Every generator also declares a `subgroup`**, which is the quiz it belongs to. The subgroup is
  what the sidebar, the routes and the quiz pages key off, so a generator without one would have no
  page and would silently vanish. A test asserts every generator has a subgroup that appears in
  `QUIZZES`.

Every question carries four fields beyond the answer, and they are what make this a trainer rather
than a quiz:

- `explain` — the method, shown after answering. Required.
- `anchor` — the rule of thumb to memorise.
- `citation` — where the fact came from, so it can be checked.
- `signature` — the spaced-repetition key, at the level of the *concept* rather than the instance.

### Data

`src/data/*.json` holds tickers, contract specs, session times and FX levels. These are imported
directly rather than through Astro content collections, because the generators must run both in the
browser (the set is assembled client-side) and in Node (the tests); content collections are a
build-time concern and cannot be read from a React island.

Fields that cannot be verified are omitted or flagged rather than guessed:

- `contracts.json` has `tickPoints: null` for every contract, because the project's spec table gives
  multipliers and expiries but not ticks. The tick drill is therefore not generated.
- `sessions.json` marks the ASX entry with an explicit unverified daylight-saving caveat, and the
  microstructure generator excludes caveated venues from session-time questions.
- `fx.json` has `verified: false`, and the one generator that would ask you to recall a level
  refuses to run while that is the case. `registry.ts` marks it unavailable and the About page shows
  why. Conversion and triangulation questions supply the rate in the question and are always fair.
- `tickers.json` carries HK, JP and AU names beside the SGX block, but only the SGX rows have market
  cap, turnover, STI weight and borrow. The others hold `null` in those fields, and the generators
  skip null rows rather than guess: cap-band and liquidity ask SGX names only, STI membership and
  hedgeability are restricted to Singapore listings. If you add a venue, add the listing facts and
  leave the numerics `null` until a source has been checked.

## Testing

```bash
npm test
```text

Two suites:

`tests/generators.test.ts` asserts, over hundreds of seeds per generator:

- the same date produces a byte-identical set, and different dates produce different sets;
- no `NaN`, no `Infinity`, exactly one correct option, well-formed answer keys;
- no numeric answer sits on a rounding boundary;
- no unavailable generator appears in the daily set;
- every question kind gets a matching empty response from `initialResponse()`, and an untouched
  question is never marked correct;
- free-text marking folds case, punctuation and suffixes, always accepts the canonical name and
  every alias, never accepts another listed company, and forgives one typo only above eight
  characters;
- put-call parity never produces a negative option value or breaches its no-arbitrage bounds, and
  holds exactly to the penny;
- each index level is within its own order of magnitude, so a name can never be paired with another
  index's level.

`tests/content.test.ts` asserts the copy layer is populated and consistent:

- every declared quiz has a guide with a purpose, a why, a method and a time;
- every declared group has a guide, and a plausible total time;
- guide prose contains no internal generator ids and no `README` references;
- every glossary id referenced by a quiz exists, and ids and terms are unique;
- every venue in `sessions.json` has a narrative note, and no note refers to a removed venue;
- every venue states its settlement method in the data rather than in the page;
- every venue's local and SGT session times agree under its stated offset, including its market close;
- the regional open and close ordering holds (JPX first to open and close, SGX last to close);
- no Korean market content remains anywhere in `src/` (the research note is exempt: it is sourced
  evidence, not published copy).

## Deployment

The site is static and published to **GitHub Pages** by `.github/workflows/deploy.yml`, which runs on
push to `main` (and on manual dispatch). The job installs with `npm ci` on the Node version from
`.nvmrc`, **runs `npm test` before building** — so a failing generator or content test blocks the
deploy — then builds and uploads `dist/` through `actions/configure-pages` and `actions/deploy-pages`.

Two things are easy to get wrong:

1. **One-time repo setting, not code.** Settings → Pages → Source must be set to **GitHub Actions**.
   Without it the workflow runs and publishes nothing.
2. **`base` must match the repository name.** `astro.config.mjs` sets
   `site: https://ryantjx.github.io` and `base: /trader-training`. If the repo is not named
   `trader-training`, every asset 404s while the HTML still loads — which looks like a CSS bug rather
   than a config error. Change `base` to `/<repo-name>`, or drop it entirely for a custom domain.

To reproduce what Pages does locally:

```bash
npm run build
mkdir -p /tmp/tt/trader-training && cp -r dist/* /tmp/tt/trader-training/
cd /tmp/tt && python3 -m http.server 4477
# then open http://localhost:4477/trader-training/quiz/fx
```

Serving under the subpath matters because it is the only way to catch a link that bypasses `base`.
Astro rewrites its own routed links, but a literal `href="/quiz/fx"` in an `.astro` file or a
component will break under the prefix. Use `import.meta.env.BASE_URL` for those.

## Known gaps

- **Tickers cover SGX only.** Hong Kong, Japan and Australia need verified datasets before those
  rows can be added.
- **The ASX market page is unverified** for daylight saving, so its session-time questions are not
  asked.
- **FX levels are illustrative.** The recall drill stays disabled until they are checked.
- **Contract tick sizes are not encoded**, so no tick-value drill is generated.
- **Korea is out of scope**, by decision. The KRX venue, KOSPI 200 contract, Chuseok calendar entry
  and the Korean venue references in the exotic drills were removed. A test asserts none return.
- **No leaderboard and no streaks**, by decision. Competition is against your own personal best.
  `ResultStore` in `storage.ts` is the single seam that a leaderboard would touch.

## Generator pool

This table used to live on the About page. It is maintainer material — internal ids, tier
assignments and an operator instruction — so it belongs here rather than in front of a trader.
Regenerate it from the registry when the pool changes; a test already asserts ids are unique and
each generator emits its own `generatorId`.

| Generator | Group | Sub-group | Tier | Tests |
| --- | --- | --- | --- | --- |
| `gamma-pnl` | Math | greeks | 1 | Gamma PnL from a gamma quoted per 1pp and a percentage move |
| `delta-pnl` | Math | greeks | 1 | Delta PnL and the per-1pp unit convention |
| `expected-move` | Math | greeks | 2 | One-day and one-week expected move |
| `delta-gamma-pnl` | Math | greeks | 3 | PnL split into linear and quadratic terms |
| `pnl-attribution` | Math | greeks | 4 | Full overnight attribution |
| `put-call-parity` | Math | put-call-parity | 1 | Missing leg of parity, to the penny |
| `put-call-parity-structure` | Math | put-call-parity | 2 | Correct rearrangement of parity |
| `bp-to-money` | Math | basis-points | 1 | Basis points of notional to money |
| `money-to-bp` | Math | basis-points | 2 | Money back to basis points |
| `index-bps-to-money` | Math | basis-points | 3 | A basis-point move in an index, in money |
| `fx-conversion` | Math | fx | 1 | Convert at a supplied rate |
| `fx-pip-value` | Math | fx | 2 | Pip value on a notional |
| `fx-triangulation` | Math | fx | 3 | Cross rate from two USD legs |
| `fx-recall-level` | Math | fx | 2 | Recall a level — **disabled**, see below |
| `forward-premium` | Math | forwards | 2 | Premium or discount direction |
| `forward-rate` | Math | forwards | 3 | Forward rate from spot and rates |
| `forward-roll-cost` | Math | forwards | 4 | Cost of rolling a hedge |
| `vega-pnl` | Math | vol | 1 | Vega PnL per vol point |
| `price-move-to-vol` | Math | vol | 2 | A price move in vol points |
| `delta-strike` | Math | vol | 3 | Strike from delta |
| `breakeven-vol` | Math | vol | 4 | Breakeven vol from gamma and theta |
| `ticker-name` | Markets | tickers | 1 | Ticker to company name |
| `ticker-sector` | Markets | tickers | 1 | Ticker to sector |
| `ticker-cap-band` | Markets | tickers | 2 | Ticker to market-cap band |
| `ticker-index-membership` | Markets | tickers | 2 | STI membership |
| `ticker-liquidity` | Markets | tickers | 3 | Ticker to turnover band |
| `ticker-hedgeability` | Markets | tickers | 4 | What listed hedge exists |
| `session-open-at-time` | Markets | microstructure | 1 | Is a venue open at an SGT time |
| `stamp-duty` | Markets | microstructure | 2 | Stamp-duty position per market |
| `clearing-house` | Markets | microstructure | 2 | Which body clears each market |
| `sgx-closing-routine` | Markets | microstructure | 3 | Order the SGX closing phases |
| `calendar-event` | Markets | market-knowledge | 1 | Which holiday closes which market |
| `access-channel` | Markets | market-knowledge | 2 | Stock Connect, QFII, H/A basis |
| `central-bank` | Markets | market-knowledge | 2 | Policy instruments by central bank |
| `index-construction` | Markets | market-knowledge | 2 | Index construction and membership |
| `contract-point-value` | Asia Derivatives | listed | 1 | Point value in money |
| `contract-notional` | Asia Derivatives | listed | 2 | Notional at a given level |
| `contract-expiry` | Asia Derivatives | listed | 2 | Expiry convention |
| `contract-cross-listed` | Asia Derivatives | listed | 3 | Which venues list which contract |
| `exotic-identify` | Asia Derivatives | exotic | 2 | Identify the structure |
| `exotic-greeks` | Asia Derivatives | exotic | 3 | Implied Greeks position |
| `exotic-hedgeability` | Asia Derivatives | exotic | 3 | What can be hedged where |
| `exotic-convention` | Asia Derivatives | exotic | 3 | Averaging, fixing, delta conventions |
| `exotic-where-sold` | Asia Derivatives | exotic | 2 | Product map by market |
| `exotic-stickiness` | Asia Derivatives | exotic | 4 | Stickiness convention and ATM vol |
| `forward-vol` | Asia Derivatives | exotic | 3 | Forward vol from spot vols |
| `vol-basis-pnl` | Asia Derivatives | exotic | 4 | Cross-market vol basis, in money |
| `vol-surface-recall` | Asia Derivatives | vol-surface | 3 | Surface shape, skew, term structure |

### Disabled generators

`fx-recall-level` is disabled while `src/data/fx.json` has `verified: false`, because the levels in
that snapshot are illustrative rather than checked against a source. Recall questions against an
unverified level would be unfair. Set `verified` to `true` only after every level in the file has
been checked; `registry.ts` marks the generator unavailable and the pool otherwise omits it.
