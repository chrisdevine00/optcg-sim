/**
 * M8-R2: a Character with a printed keyword acts on the board, so "its text does nothing on the
 * board" is false for it. The target flag's `nothingOnBoard` requires no keyword. E09 with a vanilla
 * Blocker as the chosen target must not flag; with Hawkins (no ongoing text) it does.
 */
import { describe, expect, it, vi } from 'vitest';
import { textFacts } from '../../src/search/review/explain-target.ts';
import { detect } from '../../src/search/review/target.ts';
import { cardMap } from '../support.ts';
import { attackAction, contextOf, itemAt, plantRecord } from '../support/review-plant.ts';
import { e09Spec, HAWKINS, SHIKI } from '../support/review-target-positions.ts';

vi.setConfig({ testTimeout: 120_000 });

const cards = cardMap();
const BLUENO = 'EB01-017'; // vanilla Blocker, no script

const e09With = (target: string) => {
  const base = e09Spec();
  const spec = { ...base, p2: { ...base.p2, characters: [{ card: target, rested: true }] } };
  return plantRecord(spec, (s) => [
    attackAction(s, 'p1', SHIKI, target),
    { type: 'endTurn', player: 'p1' },
  ]);
};

describe('M8-R2: keywords act on the board', () => {
  it('a keyword-only Character is not "nothing on the board"', () => {
    for (const id of [
      BLUENO, // Blocker
      'EB01-003', // Rush
      'EB04-023', // Double Attack
      'OP10-030', // Banish
      'OP16-033', // Unblockable
      'OP17-003', // Rush: Character
    ]) {
      const f = textFacts(id, cards);
      expect(f.nothingOnBoard, id).toBe(false);
      expect(f.noText, id).toBe(false);
      expect(f.keywords.length, id).toBeGreaterThan(0);
      expect(f.labels.length, id).toBeGreaterThan(0);
    }
    expect(textFacts(BLUENO, cards).labels).toEqual(['[Blocker]']);
  });

  it('a Character with no keyword and no ongoing text still is', () => {
    expect(textFacts(HAWKINS, cards).nothingOnBoard).toBe(true);
    expect(textFacts(null, cards)).toMatchObject({ nothingOnBoard: true, noText: true });
  });

  it('E09 with Hawkins as the target flags; with a vanilla Blocker it does not', () => {
    const hawkins = detect(itemAt('target', 9, 0), contextOf(e09With(HAWKINS)));
    expect(hawkins?.flags).toHaveLength(1);
    const blueno = detect(itemAt('target', 9, 0), contextOf(e09With(BLUENO)));
    expect(blueno?.flags ?? []).toHaveLength(0);
  });
});
