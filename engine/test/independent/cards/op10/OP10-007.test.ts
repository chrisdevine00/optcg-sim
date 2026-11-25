/**
 * OP10-007 Ceaser Soldier (Character, Red, cost 3, 4000, Counter +1000, {Punk Hazard}).
 *
 * Card text: "[On Play] Play up to 1 "Punk Hazard" type Character card with a cost of 2 or less from
 * your hand."
 *
 * Rules: the pick is over the hand with a filter (type and cost), so it is asked even when nothing
 * matches (no prompt may depend on hidden cards, DECISIONS 2026-11-24); "up to 1" may be 0; the card
 * is played from the hand by an effect, so it pays no cost and its own [On Play] fires.
 */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  cardIds,
  choices,
  canFinish,
  don,
  fill,
  kind,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  V10,
  VAN,
} from './kit-op10a.ts';

const SOLDIER = 'OP10-007';
/** OP10-012 Dragon Number Thirteen: Red, cost 2, 2000, {Biological Weapon}/{Punk Hazard}. [Blocker] only. */
const DRAGON13 = 'OP10-012';
/** OP10-004 Vergo: Red, cost 1, 2000, {Punk Hazard}. [On Play] look at 5 (asks a pick when played). */
const VERGO1 = 'OP10-004';

function start(hand: string[]) {
  const g = mine('ST01-001', { hand: [SOLDIER, ...hand], costArea: { active: 10, rested: 0 } });
  playRaw(g, SOLDIER);
  return g;
}

describe('OP10-007 Ceaser Soldier: [On Play] play up to 1 {Punk Hazard} Character with cost 2 or less from the hand', () => {
  it('printed values: cost 3, 4000, Counter +1000', () => {
    const g = mine('ST01-001', { hand: [SOLDIER] });
    const c = g.find('p1', 'hand', SOLDIER);
    expect(g.card(c).cost).toBe(3);
    expect(g.card(c).counter).toBe(1000);
  });

  it('plays a cost-2 {Punk Hazard} Character from the hand, free of cost', () => {
    const g = start([DRAGON13]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DRAGON13]);
    pickCards(g, [DRAGON13]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([SOLDIER, DRAGON13].sort());
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
    expect(kind(g)).toBe('main');
  });

  it('boundary: a cost-3 {Punk Hazard} Character is not offered, a cost-2 one is', () => {
    const g = start([V10.mochaPh3, DRAGON13]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DRAGON13]);
  });

  it('boundary: a cost-1 {Punk Hazard} Character is offered and its own [On Play] fires', () => {
    const g = start([VERGO1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VERGO1]);
    pickCards(g, [VERGO1]);
    // Vergo's [On Play] (look at 5 cards from the deck) asks for its pick.
    need(g, 'choose', 'p1');
    expect(cardIds(g, 'p1', 'characters')).toContain(VERGO1);
  });

  it('a Character that is not {Punk Hazard} is not offered, even with a low cost', () => {
    const g = start([VAN.sai, VAN.komachiyo, DRAGON13]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([DRAGON13]);
  });

  it('"up to 1": may play nothing', () => {
    const g = start([DRAGON13]);
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([SOLDIER]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([DRAGON13]);
  });

  it('at most 1 is played even when two qualify', () => {
    const g = start([DRAGON13, DRAGON13]);
    need(g, 'choose', 'p1');
    pickCards(g, [DRAGON13]);
    expect(cardIds(g, 'p1', 'characters').filter((c) => c === DRAGON13)).toHaveLength(1);
    expect(cardIds(g, 'p1', 'hand')).toEqual([DRAGON13]);
  });

  it('with nothing eligible in the hand the pick is still asked (it must not depend on the hidden hand)', () => {
    const g = start([VAN.marco, V10.mochaPh4]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    g.act({ type: 'done' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([SOLDIER]);
    expect(kind(g)).toBe('main');
  });

  it('with an empty hand the pick is asked as well', () => {
    const g = start([]);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
  });

  it('must not happen: only the hand is searched, not the deck or the trash', () => {
    const g = mine('ST01-001', {
      hand: [SOLDIER],
      deck: [DRAGON13, ...fill(BLUE, 8)],
      trash: [DRAGON13],
    });
    playRaw(g, SOLDIER);
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([]);
    g.act({ type: 'done' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([SOLDIER]);
  });
});
