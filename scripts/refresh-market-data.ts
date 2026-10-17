/**
 * Refreshes src/data/fx.json with current levels.
 *
 * Deliberately does NOT run automatically in CI or at build time: the daily quiz
 * must be reproducible, so market data is frozen in git and refreshed only when a
 * human runs this script and reviews the diff.
 *
 * Run with:  npm run refresh:data
 *
 * The fetch below is intentionally left as a stub. Wiring an arbitrary public API
 * in silently would put unverified numbers into a training tool, which is worse
 * than having no numbers at all. Fill in the URL and mapper, then check the diff.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = join(here, '..', 'src', 'data', 'fx.json');

type Pair = { pair: string; rate: number; pipDecimals: number };
type FxFile = {
  asOf: string;
  verified: boolean;
  source: string;
  warning: string;
  note: string;
  usdPairs: Pair[];
  policyRates: unknown[];
};

function load(): FxFile {
  return JSON.parse(readFileSync(dataPath, 'utf8')) as FxFile;
}

async function fetchLevels(): Promise<Record<string, number>> {
  // TODO: point this at a rate source you trust, and map its response to { "USD/JPY": 152.4, ... }.
  // Example shape:
  //   const res = await fetch('https://example.com/api/latest?base=USD');
  //   const json = await res.json();
  //   return json.rates;
  throw new Error(
    'No rate source configured. Edit scripts/refresh-market-data.ts and add the fetch + mapping.',
  );
}

async function main() {
  const file = load();

  let levels: Record<string, number>;
  try {
    levels = await fetchLevels();
  } catch (err) {
    console.error(String((err as Error).message));
    console.error(
      '\nfx.json left unchanged. It currently has verified=false, so recall questions stay disabled.',
    );
    process.exitCode = 1;
    return;
  }

  const updated = file.usdPairs.map((p) => {
    const next = levels[p.pair.split('/')[1] ?? ''];
    return next === undefined ? p : { ...p, rate: Math.round(next * 1e6) / 1e6 };
  });

  const changed = updated.filter(
    (p, i) => p.rate !== file.usdPairs[i]?.rate,
  );

  const out: FxFile = {
    ...file,
    asOf: new Date().toISOString().slice(0, 10),
    verified: false,
    usdPairs: updated,
    note: 'Refreshed by scripts/refresh-market-data.ts. Set verified=true ONLY after checking every level against a source.',
  };

  writeFileSync(dataPath, JSON.stringify(out, null, 2) + '\n');

  console.log(`Updated ${changed.length} of ${updated.length} pairs.`);
  for (const p of changed) console.log(`  ${p.pair}: ${p.rate}`);
  console.log('\nverified is still false. Review the diff, then set it to true.');
}

await main();
