import { useCallback, useEffect, useMemo, useState } from 'react';
import { mulberry32 } from '../../lib/rng';
import { generateParity, renderParityPrompt, solve, drawLegal } from '../../lib/generators/parity';
import { mark } from '../../lib/marking';
import { formatDuration } from '../../lib/scoring';
import { createLocalStore } from '../../lib/storage';
import { quizDateKey, paritySeed } from '../../lib/seed';
import type { NumericQuestion, Response } from '../../lib/types';

const TOTAL = 15;

export interface ParityGameProps {
  /** Fixed seed, for tests. Defaults to a seed derived from today's date. */
  seed?: number;
}

/**
 * The competitive standalone game, rebuilt from the source artifact.
 *
 * Faithful to the original: 15 questions, one hidden variable, numeric entry,
 * marked to the penny, a progress indicator, a timer that PAUSES when a question
 * is answered, then a score-and-time screen with a restart.
 *
 * Two deliberate departures from the artifact, both from the README:
 *
 *   1. No negative option values, and the no-arbitrage bounds hold. In the
 *      original, the two random premium adjustments could in principle produce
 *      an impossible price; here the construction makes that unreachable, and
 *      drawLegal asserts it.
 *   2. Accuracy only. The timer is informational and does not affect the score,
 *      because the point of the drill is whether the arithmetic is right.
 *
 * The competitive element is against your own best: the start screen shows your
 * personal best score and time, and the result screen says whether you beat it.
 * There is no leaderboard, by decision.
 */
export function ParityGame({ seed }: ParityGameProps) {
  const dateKey = quizDateKey();
  const gameSeed = seed ?? paritySeed(dateKey);

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; user: number; answer: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState(() => createLocalStore().getParityBest());
  const [improved, setImproved] = useState(false);

  // One question per index, drawn in sequence from a single stream so the whole
  // session is reproducible from the seed.
  const questions = useMemo(() => {
    const rng = mulberry32(gameSeed);
    return Array.from({ length: TOTAL }, () => {
      const q = generateParity(rng, 2) as NumericQuestion;
      // Keep the displayed draw alongside the question so the answer can be
      // shown in terms of the other legs.
      return q;
    });
  }, [gameSeed]);

  const question = questions[index];

  // Session timer. Runs from the start, and pauses while a question is answered,
  // so reading the feedback is not counted against the trader.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setElapsedMs((ms) => ms + 1000), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    setStarted(true);
    setIndex(0);
    setScore(0);
    setElapsedMs(0);
    setRunning(true);
    setValue('');
    setFeedback(null);
    setFinished(false);
    setImproved(false);
  }, []);

  const submit = useCallback(() => {
    if (!question || feedback) return;
    const parsed = Number(value);
    const response: Response = { kind: 'numeric', value: Number.isFinite(parsed) ? parsed : null };
    const result = mark(question, response);
    if (result.correct) setScore((s) => s + 1);
    setFeedback({ correct: result.correct, user: parsed, answer: question.answer });
    // Pause the session clock: the answer has been given.
    setRunning(false);
  }, [question, value, feedback]);

  const next = useCallback(() => {
    if (index + 1 >= TOTAL) {
      setFinished(true);
      const candidate = {
        score: score,
        total: TOTAL,
        elapsedMs,
        achievedAt: new Date().toISOString(),
      };
      setImproved(createLocalStore().offerParityBest(candidate));
      setBest(createLocalStore().getParityBest());
      return;
    }
    setIndex((i) => i + 1);
    setValue('');
    setFeedback(null);
    setRunning(true);
  }, [index, score, elapsedMs]);

  // ---- Start screen -------------------------------------------------------
  if (!started) {
    return (
      <div className="tt-card">
        <h2 style={{ marginTop: 0 }}>Put-Call Parity</h2>
        <p className="tt-prompt">
          Find the missing value across {TOTAL} questions. One of the five legs is hidden each time;
          give it to the penny.
        </p>
        <p className="tt-mono" style={{ padding: '0.5rem 0', fontSize: '1.05rem' }}>
          Call = (Stock − Strike) + Put + Rev/Con
        </p>
        <p className="tt-citation">
          No time limit on the score: the timer pauses when you answer and does not affect your mark.
          Answers are judged to 2 decimal places. No negative option values.
        </p>
        {best ? (
          <p className="tt-anchor">
            Your best: <span className="tt-mono">{best.score}/{best.total}</span> in{' '}
            <span className="tt-mono">{formatDuration(best.elapsedMs)}</span>.
          </p>
        ) : (
          <p className="tt-anchor">No personal best yet. This will be your baseline.</p>
        )}
        <button type="button" onClick={start} style={{ padding: '0.5rem 1.25rem', cursor: 'pointer' }}>
          Start game
        </button>
      </div>
    );
  }

  // ---- Result screen ------------------------------------------------------
  if (finished) {
    return (
      <div className="tt-card">
        <h2 style={{ marginTop: 0 }}>{score} / {TOTAL}</h2>
        <p className="tt-mono">
          {formatDuration(elapsedMs)} elapsed · {Math.round((score / TOTAL) * 100)}%
        </p>
        {improved ? (
          <p className="tt-feedback-correct">New personal best.</p>
        ) : best ? (
          <p className="tt-anchor">
            Personal best remains {best.score}/{best.total} in {formatDuration(best.elapsedMs)}.
          </p>
        ) : null}
        <div style={{ marginTop: '1rem' }}>
          <button type="button" onClick={start} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Play again
          </button>
        </div>
      </div>
    );
  }

  if (!question) return <p>Could not generate a question.</p>;

  // The prompt for the numeric question already contains the rendered table.
  return (
    <div>
      <div className="tt-row" style={{ marginBottom: '0.75rem' }}>
        <span className="tt-mono">Question {index + 1} / {TOTAL}</span>
        <span className="tt-mono">Score {score}</span>
        <span className="tt-timer">{formatDuration(elapsedMs)}</span>
      </div>

      <div className="tt-card">
        <div className="tt-prompt">
          {question.prompt.split('\n').map((line, i) => (
            <div key={i} className={/^[A-Za-z].*:\s/.test(line) ? 'tt-mono' : undefined}>
              {line || '\u00a0'}
            </div>
          ))}
        </div>

        <p className="tt-anchor" style={{ marginTop: '0.75rem' }}>
          {question.context}
        </p>

        <label className="tt-numeric" style={{ display: 'block', marginTop: '1rem' }}>
          <span style={{ display: 'block', marginBottom: '0.35rem' }}>Your answer (USD, 2 decimals)</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            disabled={feedback !== null}
            placeholder="0.00"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value !== '' && !feedback) submit();
            }}
            style={{ padding: '0.4rem 0.6rem', minWidth: '12rem', fontSize: '1rem' }}
          />
        </label>

        <div style={{ marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={submit}
            disabled={feedback !== null || value === ''}
            style={{ padding: '0.5rem 1rem', cursor: feedback || value === '' ? 'not-allowed' : 'pointer' }}
          >
            Submit answer
          </button>
        </div>
      </div>

      {feedback ? (
        <div className={`tt-card ${feedback.correct ? 'tt-feedback-correct' : 'tt-feedback-wrong'}`} role="status">
          <p style={{ marginTop: 0, fontWeight: 600 }}>
            {feedback.correct ? 'Correct!' : 'Incorrect'}
          </p>
          <p className="tt-mono">
            Your answer: ${feedback.user.toFixed(2)} | Correct answer: ${feedback.answer.toFixed(2)}
          </p>
          <p>{question.explain}</p>
          {question.anchor ? <p className="tt-anchor">Rule of thumb: {question.anchor}</p> : null}
          <div style={{ marginTop: '1rem' }}>
            <button type="button" onClick={next} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
              {index + 1 >= TOTAL ? 'See results' : 'Next question'}
            </button>
          </div>
        </div>
      ) : (
        <p className="tt-timer">{running ? 'clock running' : '(paused)'}</p>
      )}
    </div>
  );
}

export { TOTAL as PARITY_TOTAL, renderParityPrompt, solve, drawLegal };
