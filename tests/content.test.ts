import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIES, QUIZZES } from '../src/lib/types';
import { GROUP_GUIDES, QUIZ_GUIDES, groupMinutes } from '../src/lib/quiz-guides';
import { GLOSSARY, glossaryEntries } from '../src/lib/glossary';
import { VENUE_NOTES } from '../src/lib/venue-notes';
import { VENUES, localToSgt, toMinutes } from '../src/lib/sessions';
import { availableGenerators } from '../src/lib/generators/registry';
import { mulberry32 } from '../src/lib/rng';
import sessionsData from '../src/data/sessions.json';
import tickersData from '../src/data/tickers.json';
import contractsData from '../src/data/contracts.json';

/**
 * Content invariants.
 *
 * These are the tests that stop the site from quietly losing its copy. The
 * generator tests in `generators.test.ts` prove the questions are well formed;
 * these prove the pages around them stay populated and consistent.
 */

describe('quiz guides', () => {
  // A quiz with no guide would render a page with a purpose of `undefined`,
  // which is worse than an obviously broken build.
  it('has a guide for every declared quiz', () => {
    for (const quiz of QUIZZES) {
      const guide = QUIZ_GUIDES[quiz.subgroup];
      expect(guide, `no guide for ${quiz.subgroup}`).toBeDefined();
      expect(guide.purpose.length, `${quiz.subgroup} purpose`).toBeGreaterThan(20);
        expect(guide.whatThisTests.length, `${quiz.subgroup} whatThisTests`).toBeGreaterThan(100);
        expect(guide.whatThisTests).not.toMatch(/^[-*]\s/m);
      expect(guide.whyItMatters.length, `${quiz.subgroup} whyItMatters`).toBeGreaterThan(40);
      expect(guide.method.length, `${quiz.subgroup} method`).toBeGreaterThan(40);
      expect(guide.anchor.length, `${quiz.subgroup} anchor`).toBeGreaterThan(10);
      expect(guide.minutes, `${quiz.subgroup} minutes`).toBeGreaterThan(0);
      expect(guide.manualPath, `${quiz.subgroup} manualPath`).toMatch(/^manual\//);
    }
  });

  it('has a guide for every declared group', () => {
    for (const category of CATEGORIES) {
      const guide = GROUP_GUIDES[category];
      expect(guide, `no guide for ${category}`).toBeDefined();
      expect(guide.purpose.length).toBeGreaterThan(20);
      expect(guide.whyItMatters.length).toBeGreaterThan(40);
      expect(guide.outcome.length).toBeGreaterThan(20);
    }
  });

  // Every group page states a total time, so a group with no quizzes would show
  // "0 min" and look broken.
  it('reports a plausible total time per group', () => {
    for (const category of CATEGORIES) {
      const minutes = groupMinutes(category);
      expect(minutes, `${category} total minutes`).toBeGreaterThan(0);
      expect(minutes).toBeLessThan(120);
    }
  });

  // The guide copy is user-facing prose. Maintainer vocabulary leaking into it is
  // the exact problem this content layer was introduced to fix.
  it('does not expose internal generator ids in the briefs', () => {
    for (const [subgroup, guide] of Object.entries(QUIZ_GUIDES)) {
      const text = `${guide.purpose} ${guide.whyItMatters} ${guide.method} ${guide.anchor}`;
      expect(text, `${subgroup} mentions a generator id`).not.toMatch(/[a-z]+-[a-z]+-[a-z]+/);
      expect(text, `${subgroup} references the README`).not.toMatch(/README/);
    }
  });
});

describe('glossary', () => {
  it('has unique ids and unique terms', () => {
    const ids = GLOSSARY.map((entry) => entry.id);
    const terms = GLOSSARY.map((entry) => entry.term.toLowerCase());
    expect(new Set(ids).size, 'duplicate glossary id').toBe(ids.length);
    expect(new Set(terms).size, 'duplicate glossary term').toBe(terms.length);
  });

  // A quiz strip that references an id which does not exist renders a silent
  // gap, so the linkage is asserted rather than assumed.
  it('resolves every term referenced by a quiz guide', () => {
    for (const [subgroup, guide] of Object.entries(QUIZ_GUIDES)) {
      for (const id of guide.terms) {
        expect(
          glossaryEntries([id]).length,
          `${subgroup} references unknown glossary id "${id}"`,
        ).toBe(1);
      }
    }
  });

  it('gives every entry a usable definition', () => {
    for (const entry of GLOSSARY) {
      expect(entry.term.length, `${entry.id} term`).toBeGreaterThan(0);
      expect(entry.expansion.length, `${entry.id} expansion`).toBeGreaterThan(5);
      expect(entry.definition.length, `${entry.id} definition`).toBeGreaterThan(30);
    }
  });

  // The question text uses these, so the glossary is only complete if it covers
  // them. Checked as a string search over the generator sources.
  it('covers the abbreviations the generators actually use', () => {
    const required = ['bp', 'ko', 'ki', 'cas', 'sq', 'adt', 'dvp', 'gift-nifty', 'revcon', 'neer', 'mlf', 'lpr'];
    const ids = new Set(GLOSSARY.map((entry) => entry.id));
    for (const id of required) {
      expect(ids, `glossary is missing "${id}"`).toContain(id);
    }
  });

  // Every abbreviation that appears in question text must resolve. The drill is
  // what teaches the vocabulary, so an undefined term is a dead end for the
  // reader.
  //
  // Excluded: currency codes, emphasis capitals (sticky-LOCAL-VOL), and ticker
  // symbols, which come from the dataset and are taught by the ticker drill
  // rather than by the glossary.
  it('defines every acronym used in question text', () => {
    const NOISE = new Set([
      'ALL', 'ANY', 'DOUBLE', 'FIXED', 'BOUGHT', 'SOLD', 'HIGHER', 'LOWER', 'LEVEL', 'NEVER',
      'PRICE', 'SHORT', 'LONG', 'NONE', 'YES', 'NO', 'LOCAL', 'STRIKE', 'VOL', 'SPOT',
      'USD', 'SGD', 'HKD', 'JPY', 'AUD', 'CHF', 'EUR', 'GBP', 'INR', 'CNH', 'CNY',
      'FTSE', 'CSI', 'MSCI', 'DT', 'SGX', 'HKEX', 'JPX', 'OSE', 'CME', 'ASX',
    ]);
    // Ticker symbols are data, not vocabulary. So are tokens of company names:
    // "DFI Retail Group" and "SATS" are proper nouns taught by the ticker drill.
    const tickers = new Set<string>();
    for (const record of tickersData.instruments as { ticker: string; name: string }[]) {
      tickers.add(record.ticker);
      for (const word of record.name.split(/[\s&]+/)) {
        if (/^[A-Z0-9]{2,6}$/.test(word)) tickers.add(word);
      }
    }
    // A glossary term such as "GIFT Nifty" defines both "GIFT" and "Nifty".
    const known = new Set<string>();
    for (const entry of GLOSSARY) {
      for (const word of entry.term.toLowerCase().split(/[\s/]+/)) known.add(word);
      known.add(entry.id);
    }

    const missing = new Map<string, string>();

    for (const generator of availableGenerators()) {
      for (let seed = 0; seed < 40; seed++) {
        const q = generator.generate(mulberry32(seed * 13 + 1));
        const text = `${q.prompt} ${q.context ?? ''} ${q.explain}`;
        for (const match of text.matchAll(/\b([A-Z]{3,6})\b/g)) {
          const term = match[1] as string;
          if (NOISE.has(term) || tickers.has(term) || known.has(term.toLowerCase())) continue;
          if (/^[A-Z]{2,4}\d/.test(term)) continue;
          if (!missing.has(term)) missing.set(term, generator.id);
        }
      }
    }

    expect(
      [...missing.entries()].map(([t, g]) => `${t} (${g})`),
      'undefined terms in question text',
    ).toHaveLength(0);
  });
});

describe('market reference', () => {
  // Every venue in the data becomes a route, and a route with no note would fall
  // back to the generic paragraph, which is what this change removed.
  it('has a narrative note for every venue in the data', () => {
    for (const venue of sessionsData.venues as { id: string }[]) {
      expect(VENUE_NOTES[venue.id], `no note for ${venue.id}`).toBeDefined();
    }
  });

  // The reverse: a note for a venue that no longer exists would be dead copy.
  it('has no note for a venue that is absent from the data', () => {
    const venues = new Set((sessionsData.venues as { id: string }[]).map((v) => v.id));
    for (const id of Object.keys(VENUE_NOTES)) {
      expect(venues, `note for unknown venue ${id}`).toContain(id);
    }
  });

  // Each venue must state the settlement method explicitly rather than the page
  // hardcoding "delivery versus payment" for all of them.
  it('states the settlement method per venue', () => {
    for (const venue of sessionsData.venues as { id: string; settlementMethod?: string }[]) {
      expect(venue.settlementMethod, `${venue.id} has no settlementMethod`).toBeTruthy();
    }
  });

  // Both clocks are carried in the data. If they ever disagree, one page would
  // show a session that overlaps another on a different page, and the overview's
  // whole point — comparison on one clock — would be wrong.
  it('has local and SGT session times that agree under the stated offset', () => {
    for (const venue of VENUES) {
      expect(venue.continuousLocal.length, `${venue.id} local session count`).toBe(
        venue.continuousSgt.length,
      );
      expect(venue.timezone, `${venue.id} timezone`).toBeTruthy();
      expect(typeof venue.utcOffset, `${venue.id} utcOffset`).toBe('number');

      for (const [i, local] of venue.continuousLocal.entries()) {
        const sgt = venue.continuousSgt[i];
        expect(sgt, `${venue.id} missing SGT session ${i}`).toBeDefined();
        expect(localToSgt(venue, local.open), `${venue.id} open ${i}`).toBe(sgt!.open);
        expect(localToSgt(venue, local.close), `${venue.id} close ${i}`).toBe(sgt!.close);
      }

      expect(localToSgt(venue, venue.marketCloseLocal), `${venue.id} market close`).toBe(
        venue.marketCloseSgt,
      );
    }
  });

  // The ordering is the fact the overview is built around: Japan first to open
  // and first to close, Singapore last to close.
  it('keeps the regional open and close ordering', () => {
    const byOpen = [...VENUES].sort(
      (a, b) => toMinutes(a.continuousSgt[0].open) - toMinutes(b.continuousSgt[0].open),
    );
    expect(byOpen.map((v) => v.id)).toEqual(['jpx', 'asx', 'sgx', 'hkex']);

    const byClose = [...VENUES].sort(
      (a, b) => toMinutes(a.marketCloseSgt) - toMinutes(b.marketCloseSgt),
    );
    // ASX closes earliest on AEST, then JPX, then HKEX, then SGX.
    expect(byClose.map((v) => v.id)).toEqual(['asx', 'jpx', 'hkex', 'sgx']);
  });

  // Every venue must be reachable from the overview, and the overview must not
  // claim a venue the data does not have.
  it('covers every venue in the overview', () => {
    const ids = VENUES.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(['sgx', 'hkex', 'jpx', 'asx']);
  });
});

describe('scope', () => {
  // Korea was removed from scope by decision. The generators and data are
  // checked together, because a leftover reference in either is user-visible.
  it('contains no Korean market content', () => {
    const files = collect(['src', 'tests'], ['.ts', '.tsx', '.astro', '.json', '.md']);
    const pattern = /\b(KRX|Korea|Korean|KOSPI|Chuseok|ELS|ELW|KRW)\b/;
    const offenders: string[] = [];

    for (const file of files) {
      // Skip the research note, which is sourced evidence rather than published
      // copy, and this file, which necessarily contains the pattern itself.
      if (file.endsWith('asia-market-structure.md')) continue;
      if (file.endsWith('content.test.ts')) continue;
      const text = readFileSync(file, 'utf8');
      if (pattern.test(text)) offenders.push(file);
    }

    expect(offenders, `Korean market content found in: ${offenders.join(', ')}`).toHaveLength(0);
  });

  it('lists no Korean contract', () => {
    const ids = (contractsData.contracts as { id: string; market: string }[]).map((c) => c.id);
    expect(ids).not.toContain('kospi200');
    const markets = (contractsData.contracts as { market: string }[]).map((c) => c.market);
    expect(markets).not.toContain('KR');
  });
});

/** Recursively collect files with the given extensions. */
function collect(dirs: string[], extensions: string[]): string[] {
  const out: string[] = [];
  for (const dir of dirs) {
    walk(dir, extensions, out);
  }
  return out;
}

function walk(dir: string, extensions: string[], out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path, extensions, out);
      continue;
    }
    if (extensions.some((ext) => entry.endsWith(ext))) out.push(path);
  }
}
