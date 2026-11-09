/** L-SR20: a polite line written soon after another never replaces it before it can be spoken. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PoliteQueue } from '../src/play/game/politeQueue.ts';

describe('PoliteQueue (accessibility §9.3, L-SR20)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('writes a line after a quiet spell at once', () => {
    const out: string[] = [];
    const q = new PoliteQueue((t) => out.push(t), 300);
    q.push('Solved: you found lethal.');
    expect(out).toEqual(['Solved: you found lethal.']);
  });

  it('holds a line written 2 ms after another, then writes both in order', () => {
    const out: Array<[number, string]> = [];
    const t0 = Date.now();
    const q = new PoliteQueue((t) => out.push([Date.now() - t0, t]), 300);
    q.push('Solved: you found lethal.');
    vi.advanceTimersByTime(2);
    q.push('Rematch, or New game.');
    q.push('A third line.');
    expect(out.map((o) => o[1])).toEqual(['Solved: you found lethal.']);
    vi.advanceTimersByTime(1000);
    expect(out.map((o) => o[1])).toEqual([
      'Solved: you found lethal.',
      'Rematch, or New game.',
      'A third line.',
    ]);
    // Every write is at least the gap after the one before it.
    expect(out[1]![0] - out[0]![0]).toBeGreaterThanOrEqual(300);
    expect(out[2]![0] - out[1]![0]).toBeGreaterThanOrEqual(300);
  });

  it('merges a long backlog into its last waiting line, in order, dropping nothing', () => {
    const out: string[] = [];
    const q = new PoliteQueue((t) => out.push(t), 300);
    for (const t of ['a', 'b', 'c', 'd', 'e', 'f']) q.push(t);
    vi.advanceTimersByTime(5000);
    expect(out).toEqual(['a', 'b', 'c', 'd e f']);
  });

  it('forgets what is waiting when cleared', () => {
    const out: string[] = [];
    const q = new PoliteQueue((t) => out.push(t), 300);
    q.push('a');
    q.push('b');
    q.clear();
    vi.advanceTimersByTime(1000);
    expect(out).toEqual(['a']);
    q.push('c');
    expect(out).toEqual(['a', 'c']);
  });
});
