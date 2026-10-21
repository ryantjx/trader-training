# Trader Training

A static website of daily drills for an Asian exotic-options desk: mental math under mild time
pressure, and recall of the market conventions and structures the desk trades.

`README.md` is the design spec — what each game is and why. This file is the developer guide.

## Quick start

```bash
npm install
npm run dev        # local dev server
npm test           # vitest
npm run build      # static build into dist/
npm run preview    # serve the built site
```

Node 22 is pinned in `.nvmrc`.

## How it works

The site is **fully static** and deployed to GitHub Pages. There is no server, no account, and no
network call at any point: not at build time, not at play time. That constraint drives most of the
design below.

### The daily set is a pure function of the date

Twenty questions are assembled in the browser from a date key, so every visitor sees the same
questions today and a score is comparable from one day to the next.

```
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

```
/                        Today — the daily set, 20 questions from all three groups
/group/1-math            Math overview: its quizzes, plus a mixed drill
/group/2-markets         Markets overview
/group/3-asia-derivatives  Asia Derivatives overview
/quiz/greeks             one quiz
/quiz/put-call-parity    ...  (12 quiz pages in total)
/quiz/fx /quiz/forwards /quiz/vol /quiz/basis-points
/quiz/microstructure /quiz/tickers /quiz/market-knowledge
/quiz/listed /quiz/exotic /quiz/vol-surface
/reference/{sgx,hkex,jpx,krx,asx}   market-structure content
/stats /about
```

The numbered group slugs come from `GROUP_SLUGS` in `types.ts`, and the quiz list from
`QUIZZES` in the same file — which is the single source of truth for the sidebar, the routes and
the index on the homepage. Adding a quiz means adding a `Subgroup`, a `SUBGROUP_LABELS` entry, a
`QUIZZES` row, a sidebar entry in `astro.config.mjs`, and a `getStaticPaths` row in
`src/pages/quiz/[quiz].astro`.

**Build internal links with `url()` from `src/lib/url.ts`, never string concatenation.**
`import.meta.env.BASE_URL` has no trailing slash, so `${base}quiz/fx` yields
`/trader-trainingquiz/fx` — a 404 where the page still renders, which reads as a styling bug.

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
```

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

## Deployment

`.github/workflows/deploy.yml` runs the tests, builds, and publishes to GitHub Pages on push to
`main`. `astro.config.mjs` sets `site` and `base` for a project page; drop `base` and change `site`
if a custom domain is used later.

## Deployment

The site is static and published to **GitHub Pages** by `.github/workflows/deploy.yml`, which runs on
push to `main` (and on manual dispatch). The job installs with `npm ci` on the Node version from
`.nvmrc`, **runs `npm test` before building** — so a failing generator test blocks the deploy — then
builds and uploads `dist/` through `actions/configure-pages` and `actions/deploy-pages`.

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
- **No leaderboard and no streaks**, by decision. Competition is against your own personal best.
  `ResultStore` in `storage.ts` is the single seam that a leaderboard would touch.
