/**
 * OP14-109 Victoria Cindry (Character, Yellow, cost 3, 1000, Counter +1000, [Blocker],
 * {Thriller Bark Pirates}).
 *
 * Card text: "[Blocker]
 * [Trigger] Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or less from
 * your trash rested."
 *
 * Rules: CR 10-1-4 ([Blocker]: rest this card to become the new target), CR 7-1-2 (Block Step).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  blockers,
  describeTbTrigger,
  kind,
  LD14,
  mine,
  atMain,
  need,
  SC14,
  theirs,
  trash,
  chars,
  block,
  passCounter,
  hand,
} from './kit-op14d.ts';

const ID = 'OP14-109';

function defend(rested = false) {
  const g = theirs(
    LD14.neutral,
    { characters: [{ card: ID, rested }], life: [SC14.c2, SC14.c2, SC14.c2, SC14.c2] },
    {},
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  return g;
}

describe('OP14-109 Victoria Cindry: [Blocker]', () => {
  it('has the printed [Blocker] keyword', () => {
    const g = mine(LD14.neutral, { characters: [ID] });
    expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('is offered as a blocker against an attack on my Leader, and blocking costs me no Life', () => {
    const g = defend();
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    block(g, at(g, 'p1', 'characters', ID));
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
  });

  it('blocking rests it; at 1000 power it loses to a 5000 attacker and is K.O.d (trashed)', () => {
    const g = defend();
    block(g, at(g, 'p1', 'characters', ID));
    passCounter(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('a rested Cindry cannot block', () => {
    const g = defend(true);
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([]);
  });
});

describeTbTrigger(ID);
