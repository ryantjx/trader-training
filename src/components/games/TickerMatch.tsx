import { useEffect, useMemo, useState } from 'react';
import { freeRng } from '../../lib/seed';
import {
  MATCHING_MARKETS,
  buildMatchingQuestion,
  formatInstrument,
  matchingMarkets,
  ricOf,
  type MatchingDirection,
  type MatchingMarket,
} from '../../lib/ticker-match';

function visitNonce(): string {
  if (typeof crypto !== 'undefined') {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);
    return `${values[0]}-${values[1]}`;
  }
  return String(Date.now());
}

export function TickerMatch() {
  const [market, setMarket] = useState<MatchingMarket>('HK');
  const [direction, setDirection] = useState<MatchingDirection>('code-to-name');
  const [counter, setCounter] = useState(0);
  const [visitKey, setVisitKey] = useState('initial');
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    setVisitKey(visitNonce());
  }, []);

  const question = useMemo(() => {
    const rng = freeRng(`ticker-match:${visitKey}:${market}:${direction}:${counter}`);
    return buildMatchingQuestion(rng, market, direction);
  }, [counter, direction, market, visitKey]);

  const result = selected === null ? null : selected === question.answerId;
  const select = (optionId: string) => {
    if (selected !== null) return;
    setSelected(optionId);
    setScore((current) => ({
      correct: current.correct + (optionId === question.answerId ? 1 : 0),
      total: current.total + 1,
    }));
  };

  const next = () => {
    setSelected(null);
    setCounter((current) => current + 1);
  };

  const reset = () => {
    setSelected(null);
    setScore({ correct: 0, total: 0 });
    setCounter((current) => current + 1);
  };

  return (
    <div className="tt-ticker-match">
      <div className="tt-row" style={{ marginBottom: '0.75rem' }}>
        <span className="tt-mono">{score.correct} / {score.total} correct</span>
        <span className="tt-citation">Randomized on this visit</span>
      </div>

      <div className="tt-segmented" role="tablist" aria-label="Market">
        {MATCHING_MARKETS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={candidate === market}
            onClick={() => {
              setMarket(candidate);
              setSelected(null);
            }}
          >
            {candidate}
          </button>
        ))}
      </div>

      <div className="tt-segmented" role="group" aria-label="Matching direction" style={{ marginTop: '0.5rem' }}>
        <button type="button" aria-pressed={direction === 'code-to-name'} onClick={() => { setDirection('code-to-name'); setSelected(null); }}>
          Code to name
        </button>
        <button type="button" aria-pressed={direction === 'name-to-code'} onClick={() => { setDirection('name-to-code'); setSelected(null); }}>
          Name to code
        </button>
      </div>

      <div className="tt-card" style={{ marginTop: '1rem' }}>
        <p className="tt-citation">{matchingMarkets[market].index} · {matchingMarkets[market].venue}</p>
        <p className="tt-prompt">{question.prompt}</p>
        <div role="radiogroup" aria-label="Matching answers">
          {question.options.map((option) => {
            const isCorrect = option.id === question.answerId;
            const isSelected = option.id === selected;
            const state = selected === null ? '' : isCorrect ? ' tt-choice-correct' : isSelected ? ' tt-choice-wrong' : ' tt-choice-locked';
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`tt-choice-option${state}`}
                onClick={() => select(option.id)}
                disabled={selected !== null}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {selected !== null ? (
          <div className={result ? 'tt-feedback-correct' : 'tt-feedback-wrong'} role="status" style={{ marginTop: '1rem' }}>
            <strong>{result ? 'Correct' : 'Not quite'}</strong>
            <p>{formatInstrument(market, question.instrument)} · RIC {ricOf(market, question.instrument.code)}</p>
            <button type="button" onClick={next}>{'Next question'}</button>
          </div>
        ) : null}
      </div>

      <button type="button" onClick={reset} style={{ marginTop: '0.75rem' }}>New round</button>
    </div>
  );
}