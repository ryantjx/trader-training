/**
 * The generator registry.
 *
 * One list, so the daily set builder, the drill pages, the tests and the docs
 * all read from the same source of truth.
 *
 * `available` exists because a generator can be structurally unable to run — the
 * FX recall drill is the case in point, since it would be unfair until fx.json
 * has been verified. Such a generator is listed (so the drill page can say so)
 * but excluded from the daily set.
 */
import { gammaGenerators } from './gamma';
import { parityGenerators } from './parity';
import { tickerGenerators } from './tickers';
import { bpGenerators } from './bp';
import { fxGenerators, fxDataVerified } from './fx';
import { forwardGenerators } from './forward';
import { vegaGenerators } from './vega';
import { microstructureGenerators } from './microstructure';
import { contractGenerators } from './contracts';
import { exoticGenerators } from './exotics';
import { volSurfaceGenerators } from './vol-surface';
import { marketKnowledgeGenerators } from './knowledge';
import {
  CATEGORIES,
  QUIZZES,
  SUBGROUP_LABELS,
  type Category,
  type Generator,
  type Subgroup,
  type Tier,
} from '../types';

export interface RegisteredGenerator extends Generator {
  /** False when the generator's data is not verified and it must not be asked. */
  available: boolean;
  /** Reason it is unavailable, for display on the drill page. */
  unavailableReason?: string;
}

function register(list: readonly Generator[]): RegisteredGenerator[] {
  return list.map((g) => {
    if (g.id === 'fx-recall-level' && !fxDataVerified) {
      return {
        ...g,
        available: false,
        unavailableReason:
          'Disabled: the FX level in the data snapshot is illustrative, not verified. Recall questions would be unfair. Set verified to true in src/data/fx.json once the levels have been checked against a source.',
      };
    }
    return { ...g, available: true };
  });
}

export const GENERATORS: readonly RegisteredGenerator[] = [
  // Math
  ...register(gammaGenerators),
  ...register(parityGenerators),
  ...register(bpGenerators),
  ...register(fxGenerators),
  ...register(forwardGenerators),
  ...register(vegaGenerators),
  // Markets
  ...register(tickerGenerators),
  ...register(microstructureGenerators),
  ...register(marketKnowledgeGenerators),
  // Asia Derivatives
  ...register(contractGenerators),
  ...register(exoticGenerators),
  ...register(volSurfaceGenerators),
];

export function availableGenerators(): RegisteredGenerator[] {
  return GENERATORS.filter((g) => g.available);
}

export function generatorsForCategory(category: Category): RegisteredGenerator[] {
  return GENERATORS.filter((g) => g.category === category);
}

/**
 * The generators of one quiz (subgroup). This is what a quiz page renders.
 */
export function generatorsForQuiz(subgroup: Subgroup): RegisteredGenerator[] {
  return GENERATORS.filter((g) => g.subgroup === subgroup);
}

/**
 * Quizzes that actually have generators, in sidebar order.
 */
export function populatedQuizzes(): { subgroup: Subgroup; category: Category; label: string }[] {
  return QUIZZES.filter((q) =>
    GENERATORS.some((g) => g.subgroup === q.subgroup && g.available),
  );
}

/**
 * The generators of a category grouped by quiz, in the order of QUIZZES. Used by
 * the group overview page so it lists its quizzes in a stable order.
 */
export function generatorsBySubgroup(
  category: Category,
): { subgroup: Subgroup; label: string; generators: RegisteredGenerator[] }[] {
  const inCategory = generatorsForCategory(category);
  return QUIZZES.filter((q) => q.category === category)
    .map((q) => ({
      subgroup: q.subgroup,
      label: q.label,
      generators: inCategory.filter((g) => g.subgroup === q.subgroup),
    }))
    .filter((bucket) => bucket.generators.length > 0);
}

/**
 * Categories that actually have generators attached. Used by the sidebar and the
 * tests so an empty group cannot appear in the UI.
 */
export function populatedCategories(): Category[] {
  return CATEGORIES.filter((category) =>
    GENERATORS.some((g) => g.category === category && g.available),
  );
}

export function generatorById(id: string): RegisteredGenerator | undefined {
  return GENERATORS.find((g) => g.id === id);
}

/**
 * Generators usable at a given tier. A generator is usable at its own tier and
 * above, so the daily set can be filled for a lower tier from easier generators
 * and for a higher tier from the harder ones.
 */
export function generatorsAtTier(category: Category, tier: Tier): RegisteredGenerator[] {
  const all = availableGenerators().filter((g) => g.category === category);
  const atOrBelow = all.filter((g) => g.tier <= tier);
  return atOrBelow.length > 0 ? atOrBelow : all;
}
