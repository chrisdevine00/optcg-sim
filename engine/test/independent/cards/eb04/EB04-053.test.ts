/**
 * EB04-053 Sentomaru (Character, Yellow, cost 2, 1000, Counter +1000, {Navy}/{Egghead}).
 *
 * Card text: "[Blocker] (After your opponent declares an attack, you may rest this card to make it the
 * new target of the attack.)
 * [On Block] If you have 2 or less Life cards, draw 1 card."
 *
 * Rules: [On Block] fires when this Character blocks (CR 10-2-15), not when another Character
 * blocks. The Life count is checked when it resolves.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  BLUE,
  blockers,
  deck,
  fill,
  hand,
  isRestedInst,
  kind,
  LB,
  need,
  theirs,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-053';
const HAJ = 'OP01-018'; // Red, cost 4, 6000
const MARCO = 'OP01-023';
/** OP09-072 Franky: Purple, cost 4, 5000, [Blocker] (its [On Play] only matters when played). */
const FRANKY = 'OP09-072';
/** OP01-012 Sai: top card marker. */
const TOP = 'OP01-012';

function defending(life: number, own: string[] = [ID]): TestGame {
  const g = theirs(
    LB.egghead,
    { characters: own, life: fill(BLUE, life), deck: [TOP, ...fill(BLUE, 9)], hand: [MARCO] },
    { characters: [HAJ] },
  );
  attack(g, at(g, 'p2', 'characters', HAJ), g.leader('p1'));
  need(g, 'block', 'p1');
  return g;
}

describe('EB04-053 Sentomaru: [Blocker]; [On Block] with 2 or less Life, draw 1 card', () => {
  it('can block, becoming the new target; it is rested', () => {
    const g = defending(2);
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', ID)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(isRestedInst(g, at(g, 'p1', 'characters', ID))).toBe(true);
  });

  it('with 2 Life cards it draws 1 card when it blocks', () => {
    const g = defending(2);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(hand(g)).toEqual([MARCO, TOP].sort());
    expect(deck(g)).toHaveLength(9);
  });

  it('boundary: with 3 Life cards it draws nothing', () => {
    const g = defending(3);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(hand(g)).toEqual([MARCO]);
    expect(deck(g)).toHaveLength(10);
  });

  it('with 0 Life cards it draws 1 card', () => {
    // 0 Life: the attack on the Leader would end the game unless blocked; the block draws.
    const g = defending(0);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(hand(g)).toEqual([MARCO, TOP].sort());
  });

  it('does not draw when it does not block (no block declared)', () => {
    const g = defending(2);
    act(g, { type: 'block', blocker: null });
    expect(hand(g)).toEqual([MARCO]);
  });

  it('does not draw when another Character blocks instead', () => {
    const g = defending(2, [ID, FRANKY]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', FRANKY) });
    expect(hand(g)).toEqual([MARCO]);
    expect(isRestedInst(g, at(g, 'p1', 'characters', ID))).toBe(false);
  });

  it('draws exactly 1 card, once per block', () => {
    const g = defending(1);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(hand(g)).toHaveLength(2);
    expect(kind(g)).toBe('counter');
  });

  it('also blocks an attack aimed at one of your rested Characters and then draws (Life 2)', () => {
    const g = theirs(
      LB.egghead,
      {
        characters: [ID, { card: MARCO, rested: true }],
        life: fill(BLUE, 2),
        deck: [TOP, ...fill(BLUE, 9)],
      },
      { characters: [HAJ] },
    );
    attack(g, at(g, 'p2', 'characters', HAJ), at(g, 'p1', 'characters', MARCO));
    need(g, 'block', 'p1');
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(hand(g)).toEqual([TOP]);
  });

  it('the card is drawn when the block is declared, even though the 6000 attacker then K.O.s Sentomaru', () => {
    const g = defending(2);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', ID) });
    expect(hand(g)).toEqual([MARCO, TOP].sort());
    g.act({ type: 'endCounter' });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toHaveLength(2);
  });
});
