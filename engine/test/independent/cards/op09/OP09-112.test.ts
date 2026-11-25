/**
 * OP09-112 Belo Betty (Character, Yellow, cost 3, 4000, Counter +1000, {Revolutionary Army}).
 *
 * Card text: "[On Play] If you have 2 or less Life cards, draw 1 card.
 * [Trigger] If your Leader has the "Revolutionary Army" type and you and your opponent have a total of
 * 5 or less Life cards, play this card."
 *
 * Rules: CR 10-1-5 ([Trigger]); the Life card taken by damage has left the Life area while its
 * [Trigger] resolves; a Trigger whose condition fails does not play the card and it is trashed.
 * Open reading (note only): whether the trigger card still counts in the Life total while it resolves.
 * The boundary tests below count it as gone (it has been taken); the clear-cut cases do not depend on it.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  atMain,
  BLUE,
  C9,
  chars,
  hand,
  hitLeader,
  L9,
  mine,
  need,
  playId,
  RED,
  theirs,
  trash,
} from './kit-op09d.ts';

const ID = 'OP09-112';

const life = (n: number) => Array(n).fill(BLUE) as string[];

describe('OP09-112 Belo Betty: [On Play] if I have 2 or less Life, draw 1', () => {
  function play(lifeN: number, o: { leader?: string; oppLife?: number } = {}) {
    const g = mine(
      o.leader ?? L9.ra,
      { hand: [ID], life: life(lifeN), deck: [C9.c4, C9.c5, ...Array(10).fill(BLUE)] },
      { life: Array(o.oppLife ?? 4).fill(RED) },
    );
    playId(g, ID);
    return g;
  }

  it('boundary: with exactly 2 Life cards, 1 card is drawn', () => {
    const g = play(2);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([C9.c4]);
    expect(chars(g)).toEqual([ID]);
  });

  it('boundary: with 3 Life cards nothing is drawn', () => {
    const g = play(3);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(g.zone('p1', 'deck')).toHaveLength(12);
  });

  it('1 Life card and 0 Life cards both qualify; exactly 1 card is drawn', () => {
    expect(hand(play(1))).toEqual([C9.c4]);
    expect(hand(play(0))).toEqual([C9.c4]);
  });

  it('only MY Life counts: the opponent having 4 Life does not matter, and 5 of mine does not draw', () => {
    expect(hand(play(2, { oppLife: 4 }))).toEqual([C9.c4]);
    expect(hand(play(5, { oppLife: 0 }))).toEqual([]);
  });

  it('the Leader needs no type for the [On Play]', () => {
    expect(hand(play(2, { leader: L9.neutral }))).toEqual([C9.c4]);
  });

  it('the [On Play] needs the card to be played: a copy in hand does nothing', () => {
    const g = mine(L9.ra, { hand: [ID], life: life(1) });
    expect(hand(g)).toEqual([ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(15);
  });
});

describe('OP09-112 Belo Betty: [Trigger] play this card if my Leader is {Revolutionary Army} and the Life total is 5 or less', () => {
  /** p2 hits p1's Leader; p1's top Life card is Betty. `mineLife` counts Betty. */
  function hit(mineLife: number, oppLife: number, leader: string = L9.ra) {
    const g = theirs(
      leader,
      { life: [ID, ...life(mineLife - 1)], deck: [C9.c4, C9.c5, ...Array(10).fill(BLUE)] },
      { life: Array(oppLife).fill(RED) },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    return g;
  }

  it('clear case: 2 Life left for me and 2 for the opponent (total 4): Betty is played, and her [On Play] draws 1', () => {
    const g = hit(3, 2);
    activateTrigger(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([C9.c4]);
    expect(trash(g)).toEqual([]);
  });

  it('boundary: after the damage I have 2 and the opponent 3 (total exactly 5): played', () => {
    const g = hit(3, 3);
    activateTrigger(g);
    expect(chars(g)).toEqual([ID]);
  });

  it('boundary: after the damage I have 2 and the opponent 4 (total 6): not played, the card is trashed', () => {
    const g = hit(3, 4);
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('clear case: 5 Life for me after the damage and 4 for the opponent: not played, trashed', () => {
    const g = hit(6, 4);
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('a Leader without {Revolutionary Army} (total 4): the condition fails, the card is trashed', () => {
    const g = hit(3, 2, L9.neutral);
    activateTrigger(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('played by the [Trigger] with 3 Life left for me (opponent 2, total 5): played, but the [On Play] does not draw', () => {
    const g = hit(4, 2);
    activateTrigger(g);
    expect(chars(g)).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('declining the [Trigger] puts Betty into my hand, nothing is played', () => {
    const g = hit(3, 2);
    g.act({ type: 'trigger', activate: false });
    expect(hand(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
  });

  it('the Character comes in active (a [Trigger] play is not rested) and is a normal Character', () => {
    const g = hit(3, 2);
    activateTrigger(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
  });
});
