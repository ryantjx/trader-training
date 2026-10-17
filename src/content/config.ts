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
 * The market-structure research note at src/content/sgx-market-structure.md.
 *
 * Kept at that path because it is referenced from the project README and from
 * the generator comments. It is source material, not site content, so it is a
 * collection rather than a published page.
 */
const research = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).passthrough(),
});

export const collections = { docs, research };
