/**
 * OP14-102 Kumacy (Character, Yellow, cost 1, 2000, Counter +2000, {Thriller Bark Pirates}).
 *
 * Card text: no effect text. "[Trigger] Play up to 1 {Thriller Bark Pirates} type Character card
 * with a cost of 4 or less from your trash rested."
 *
 * Rules: CR 10-1-5 ([Trigger]), CR 7-1-3 (Counter Step: a Character's Counter value is added).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  attack,
  BLUE,
  deckTop,
  describeTbTrigger,
  hand,
  kind,
  LD14,
  mine,
  noDefenceUntilTrigger,
  passBlock,
  SC14,
  theirs,
  trash,
  useCounter,
  at,
} from './kit-op14d.ts';

const ID = 'OP14-102';

describe('OP14-102 Kumacy: a vanilla Character with a Counter of 2000', () => {
  it('playing it asks nothing (no [On Play] effect) and costs 1', () => {
    const g = mine(LD14.neutral, { hand: [ID], deck: deckTop([]) });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(atMain(g)).toBe(true);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.card(at(g, 'p1', 'characters', ID)).power).toBe(2000);
  });

  it('Counter +2000 beats an attack of 6000 on my 5000 Leader (a +1000 Counter would tie and lose)', () => {
    const g = theirs(
      LD14.neutral,
      { hand: [ID, BLUE], life: [BLUE, BLUE, BLUE, BLUE] },
      { characters: [SC14.c4] },
    );
    const atk = g.find('p2', 'characters', SC14.c4);
    attack(g, atk, g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(7000);
    g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(trash(g)).toEqual([ID]);
  });

  it('without the Counter the same 6000 attack hits', () => {
    const g = theirs(
      LD14.neutral,
      { hand: [ID, BLUE], life: [BLUE, BLUE, BLUE, BLUE] },
      { characters: [SC14.c4] },
    );
    attack(g, g.find('p2', 'characters', SC14.c4), g.leader('p1'));
    noDefenceUntilTrigger(g);
    expect(kind(g)).toBe('trigger');
    g.act({ type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toContain(ID);
  });
});

describeTbTrigger(ID);
