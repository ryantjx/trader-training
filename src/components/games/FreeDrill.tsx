import { useCallback, useEffect, useMemo, useState } from 'react';
import { generatorsForCategory, generatorsForQuiz } from '../../lib/generators/registry';
import { freeRng } from '../../lib/seed';
import { mark } from '../../lib/marking';
import { initialResponse } from '../../lib/responses';
import type { Category, Question, Response, Subgroup } from '../../lib/types';
import { QuestionCard } from './QuestionCard';
import { FeedbackPanel } from './FeedbackPanel';

export interface FreeDrillProps {
  /** Practise one whole group, or one quiz inside it. Give exactly one. */
  category?: Category;
  subgroup?: Subgroup;
}

function visitNonce(): string {
  if (typeof crypto !== 'undefined') {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);
    return `${values[0]}-${values[1]}`;
  }
  return String(Date.now());
}

/**
 * Unlimited practice on a single category.
 *
 * Deliberately untimed and unlimited: this is the mode for working on something
 * specific rather than for measuring yourself. The only score is the running
 * tally within the session, and nothing is written anywhere.
 *
 * The seed advances on every question, so questions do not repeat within a
 * session.
 */
export function FreeDrill({ category, subgroup }: FreeDrillProps) {
  const pool = useMemo(
    () =>
      (subgroup ? generatorsForQuiz(subgroup) : generatorsForCategory(category as Category)).filter(
        (g) => g.available,
      ),
    [category, subgroup],
  );
  const [counter, setCounter] = useState(0);
  const [visitKey, setVisitKey] = useState('initial');
  const [response, setResponse] = useState<Response>({ kind: 'numeric', value: null });
  const [result, setResult] = useState<ReturnType<typeof mark> | null>(null);
  const [tally, setTally] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    setVisitKey(visitNonce());
  }, []);

  // A fresh question each time the counter advances.
  const question = useMemo<Question | null>(() => {
    if (pool.length === 0) return null;
    const rng = freeRng(`${subgroup ?? category}:${visitKey}:${counter}`);
    const generator = pool[rng.int(0, pool.length - 1)] as (typeof pool)[number];
    return generator.generate(rng);
  }, [pool, subgroup, category, counter, visitKey]);

  useEffect(() => {
    if (!question) return;
    setResponse(initialResponse(question));
    setResult(null);
  }, [question]);

  const submit = useCallback(() => {
    if (!question || result) return;
    const marked = mark(question, response);
    setResult(marked);
    setTally((t) => ({ correct: t.correct + (marked.correct ? 1 : 0), total: t.total + 1 }));
  }, [question, response, result]);

  const selectChoice = useCallback((optionId: string) => {
    if (!question || question.kind !== 'choice' || result) return;
    const nextResponse: Response = { kind: 'choice', optionId };
    setResponse(nextResponse);
    const marked = mark(question, nextResponse);
    setResult(marked);
    setTally((t) => ({ correct: t.correct + (marked.correct ? 1 : 0), total: t.total + 1 }));
  }, [question, result]);

  if (pool.length === 0) {
    return <p>No generators are available for this quiz yet.</p>;
  }

  if (!question) return null;

  return (
    <div>
      <div className="tt-row" style={{ marginBottom: '0.75rem' }}>
        <span className="tt-mono">
          {tally.correct} / {tally.total} so far
        </span>
        <span className="tt-citation">Untimed · unlimited · scored within this session only</span>
      </div>

      <QuestionCard
        question={question}
        response={response}
        onChange={setResponse}
        locked={result !== null}
        onSubmit={submit}
        onChoiceSelect={selectChoice}
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
