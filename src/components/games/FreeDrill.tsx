import { useCallback, useEffect, useMemo, useState } from 'react';
import { generatorsForCategory } from '../../lib/generators/registry';
import { freeRng } from '../../lib/seed';
import { mark } from '../../lib/marking';
import { createLocalStore } from '../../lib/storage';
import { review } from '../../lib/srs';
import type { Category, Question, Response, Tier } from '../../lib/types';
import { QuestionCard } from './QuestionCard';
import { FeedbackPanel } from './FeedbackPanel';

export interface FreeDrillProps {
  category: Category;
  tier?: Tier;
}

/**
 * Unlimited practice on a single category.
 *
 * Deliberately untimed and unlimited: this is the mode for working on something
 * specific rather than for measuring yourself, so there is no score to carry and
 * nothing written to the daily record. Misses still feed the spaced-repetition
 * queue, because a concept you got wrong in a drill is exactly the concept that
 * should come back.
 *
 * The seed advances on every question, so questions do not repeat within a
 * session.
 */
export function FreeDrill({ category, tier = 2 }: FreeDrillProps) {
  const pool = useMemo(() => generatorsForCategory(category).filter((g) => g.available), [category]);
  const [counter, setCounter] = useState(0);
  const [response, setResponse] = useState<Response>({ kind: 'numeric', value: null });
  const [result, setResult] = useState<ReturnType<typeof mark> | null>(null);
  const [tally, setTally] = useState({ correct: 0, total: 0 });

  // A fresh question each time the counter advances.
  const question = useMemo<Question | null>(() => {
    if (pool.length === 0) return null;
    const rng = freeRng(`${category}:${counter}`);
    const generator = pool[rng.int(0, pool.length - 1)] as (typeof pool)[number];
    return generator.generate(rng, tier);
  }, [pool, category, counter, tier]);

  useEffect(() => {
    if (!question) return;
    if (question.kind === 'numeric') setResponse({ kind: 'numeric', value: null });
    else if (question.kind === 'choice') setResponse({ kind: 'choice', optionId: null });
    else setResponse({ kind: 'ordering', order: question.items.map((i) => i.id) });
    setResult(null);
  }, [question]);

  const submit = useCallback(() => {
    if (!question || result) return;
    const marked = mark(question, response);
    setResult(marked);
    setTally((t) => ({ correct: t.correct + (marked.correct ? 1 : 0), total: t.total + 1 }));

    const store = createLocalStore();
    const srs = store.getSrs();
    srs[question.signature] = review(srs[question.signature], question.signature, marked.correct);
    store.saveSrs(srs);
  }, [question, response, result]);

  if (pool.length === 0) {
    return <p>No generators are available for this category yet.</p>;
  }

  if (!question) return null;

  return (
    <div>
      <div className="tt-row" style={{ marginBottom: '0.75rem' }}>
        <span className="tt-mono">
          {tally.correct} / {tally.total} so far
        </span>
        <span className="tt-citation">Untimed · unlimited · not counted in your daily record</span>
      </div>

      <QuestionCard
        question={question}
        response={response}
        onChange={setResponse}
        locked={result !== null}
        onSubmit={submit}
        secondsLeft={null}
      />

      {result ? (
        <FeedbackPanel
          question={question}
          response={response}
          result={result}
          onNext={() => setCounter((c) => c + 1)}
          isLast={false}
        />
      ) : null}
    </div>
  );
}
