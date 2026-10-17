import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildDailySet } from '../../lib/daily';
import { mark } from '../../lib/marking';
import { formatDuration, scoreSession } from '../../lib/scoring';
import { createLocalStore, toStoredAnswers } from '../../lib/storage';
import { quizDateKey } from '../../lib/seed';
import { timeMode, type TimeMode } from '../../lib/modes';
import { review } from '../../lib/srs';
import type { AnswerRecord, Response, Tier } from '../../lib/types';
import { QuestionCard } from './QuestionCard';
import { FeedbackPanel } from './FeedbackPanel';
import { ResultSummary } from './ResultSummary';

export interface DailyChallengeProps {
  mode?: TimeMode;
  tier?: Tier;
  /** Fixed date, for tests and for replaying a past set. */
  dateKey?: string;
}

export function DailyChallenge({ mode = 'drill', tier, dateKey }: DailyChallengeProps) {
  const resolvedDate = dateKey ?? quizDateKey();
  const spec = timeMode(mode);
  const resolvedTier = tier ?? spec.defaultTier;

  const set = useMemo(() => buildDailySet(resolvedDate, resolvedTier), [resolvedDate, resolvedTier]);

  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState<Response>({ kind: 'numeric', value: null });
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [lockedResult, setLockedResult] = useState<ReturnType<typeof mark> | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [secondsLeft, setSecondsLeft] = useState<number | null>(spec.secondsPerQuestion);
  const [finished, setFinished] = useState(false);

  const question = set.questions[index];

  // Reset the response shape and timer whenever the question changes, so a
  // numeric answer cannot leak into a choice question.
  useEffect(() => {
    if (!question) return;
    if (question.kind === 'numeric') setResponse({ kind: 'numeric', value: null });
    else if (question.kind === 'choice') setResponse({ kind: 'choice', optionId: null });
    else setResponse({ kind: 'ordering', order: question.items.map((i) => i.id) });
    setLockedResult(null);
    setStartedAt(Date.now());
    setSecondsLeft(spec.secondsPerQuestion);
  }, [question, spec.secondsPerQuestion]);

  const submit = useCallback(() => {
    if (!question || lockedResult) return;
    const result = mark(question, response);
    const elapsedMs = Date.now() - startedAt;

    setLockedResult(result);
    setRecords((prev) => [...prev, { question, response, correct: result.correct, elapsedMs }]);

    // Spaced repetition: the concept, not the instance.
    const store = createLocalStore();
    const srs = store.getSrs();
    srs[question.signature] = review(srs[question.signature], question.signature, result.correct);
    store.saveSrs(srs);
  }, [question, response, lockedResult, startedAt]);

  // Per-question countdown. Stops once the question is locked, so reading the
  // explanation is never timed.
  useEffect(() => {
    if (spec.secondsPerQuestion === null || lockedResult || finished) return;
    setSecondsLeft(spec.secondsPerQuestion);
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [spec.secondsPerQuestion, lockedResult, finished, index]);

  // Auto-submit when the timer expires, so an unanswered question is recorded
  // rather than silently skipped.
  useEffect(() => {
    if (secondsLeft === 0 && !lockedResult && question) {
      const result = mark(question, response);
      setLockedResult(result);
      setRecords((prev) => [...prev, { question, response, correct: result.correct, elapsedMs: (spec.secondsPerQuestion ?? 0) * 1000 }]);
    }
  }, [secondsLeft, lockedResult, question, response, spec.secondsPerQuestion]);

  const next = useCallback(() => {
    if (index + 1 >= set.questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  }, [index, set.questions.length]);

  const score = useMemo(() => scoreSession(records), [records]);

  // Persist once, on completion. saveDaily overwrites by date, so replaying the
  // same day replaces the record rather than duplicating it.
  useEffect(() => {
    if (!finished) return;
    const store = createLocalStore();
    store.saveDaily({
      dateKey: resolvedDate,
      completedAt: new Date().toISOString(),
      score,
      answers: toStoredAnswers(records),
    });
  }, [finished, resolvedDate, score, records]);

  if (finished) {
    return (
      <ResultSummary
        dateKey={resolvedDate}
        score={score}
        onRestart={() => {
          setIndex(0);
          setRecords([]);
          setFinished(false);
        }}
      />
    );
  }

  if (!question) return <p>No questions available for this set.</p>;

  return (
    <div>
      <div className="tt-row" style={{ marginBottom: '0.75rem' }}>
        <span className="tt-mono">
          Question {index + 1} / {set.questions.length}
        </span>
        <span className="tt-mono">Score {records.filter((r) => r.correct).length}</span>
        <span className="tt-timer">
          elapsed {formatDuration(records.reduce((s, r) => s + r.elapsedMs, 0))}
        </span>
      </div>

      <p className="tt-citation" style={{ marginTop: 0 }}>
        {timeMode(mode).label} mode · tier {resolvedTier} · {question.category}
      </p>

      <QuestionCard
        question={question}
        response={response}
        onChange={setResponse}
        locked={lockedResult !== null}
        onSubmit={submit}
        secondsLeft={secondsLeft}
      />

      {lockedResult ? (
        <FeedbackPanel
          question={question}
          response={response}
          result={lockedResult}
          onNext={next}
          isLast={index + 1 >= set.questions.length}
        />
      ) : null}
    </div>
  );
}
