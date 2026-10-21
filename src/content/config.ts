import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { glob } from 'astro/loaders';

/**
 * Content collections.
 *
 * Note what is NOT here: the quiz datasets. Tickers, contracts, sessions and FX
 * levels live in `src/data/*.json` and are imported directly, because the
 * generators must run in the browser (the daily set is assembled client-side)
 * and in Node (the tests). Content collections are an Astro-build-time concern
 * and cannot be read from a React island, so putting the datasets there would
 * have made the generators untestable outside a full build.
 */

// Starlight's own collection, required by the integration.
const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema(),
});

/**
 * The market-structure research note at src/content/asia-market-structure.md.
 *
 * It is source material rather than site content: the published version of this
 * material is the manual under src/content/docs/manual/, which is written for a
 * reader, whereas this note is the sourced evidence behind it (rulebook links,
 * as-of dates, quoted figures). Keeping the two apart means the site can be
 * edited for clarity without losing the provenance.
 */
const research = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).passthrough(),
});

export const collections = { docs, research };
