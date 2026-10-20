/**
 * The empty response for a question.
 *
 * Every mode resets its input when the question changes, and the reset has to
 * match the question's interaction shape or a numeric value leaks into a text
 * question. Keeping that mapping in one function is what stopped the three
 * copies from drifting after the free-text kind was added.
 */
import type { Question, Response } from './types';

export function initialResponse(question: Question): Response {
  switch (question.kind) {
    case 'numeric':
      return { kind: 'numeric', value: null };
    case 'choice':
      return { kind: 'choice', optionId: null };
    case 'ordering':
      return { kind: 'ordering', order: question.items.map((item) => item.id) };
    case 'text':
      return { kind: 'text', text: '' };
  }
}

/** Whether a response carries something that can be submitted. */
export function hasResponse(question: Question, response: Response): boolean {
  if (question.kind === 'numeric' && response.kind === 'numeric') return response.value !== null;
  if (question.kind === 'choice' && response.kind === 'choice') return response.optionId !== null;
  if (question.kind === 'text' && response.kind === 'text') return response.text.trim() !== '';
  if (question.kind === 'ordering' && response.kind === 'ordering') {
    return response.order.length === question.items.length;
  }
  return false;
}
