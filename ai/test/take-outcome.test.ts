/** Review M5a-17: the "take the hit" outcome is true before damage resolves, for any Life card. */
import { describe, expect, it } from 'vitest';
import { takeOutcome, type CardFact } from '../src/explain.ts';

const atk = (keywords: string[] = []): CardFact => ({
  card: 'X',
  name: 'Queen',
  power: 7000,
  isLeader: false,
  keywords,
});

describe('takeOutcome', () => {
  it('a plain hit: one Life card, to the hand unless a [Trigger] is used', () => {
    expect(takeOutcome(4, atk())).toBe(
      'It drops to 3 Life; the Life card goes to its hand unless it uses a [Trigger].',
    );
  });
  it('[Banish] trashes the Life card (CR 10-1-3-1)', () => {
    expect(takeOutcome(2, atk(['Banish']))).toBe(
      'It drops to 1 Life; [Banish] trashes the Life card.',
    );
  });
  it('[Double Attack] takes two, but never more than it has (RL-20)', () => {
    expect(takeOutcome(3, atk(['Double Attack']))).toBe(
      'It drops to 1 Life; both Life cards go to its hand unless it uses a [Trigger].',
    );
    expect(takeOutcome(1, atk(['Double Attack']))).toMatch(/^It drops to 0 Life; the Life card/);
    expect(takeOutcome(2, atk(['Double Attack', 'Banish']))).toBe(
      'It drops to 0 Life; [Banish] trashes both Life cards.',
    );
  });
  it('never claims where the card went as a fact (no past tense)', () => {
    for (const k of [[], ['Banish'], ['Double Attack']])
      expect(takeOutcome(3, atk(k))).not.toMatch(/went|Lost/);
  });
});
