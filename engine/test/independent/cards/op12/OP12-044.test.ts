/**
 * OP12-044 Sakazuki (Character, Blue, cost 7, 8000, no Counter, {Navy}).
 *
 * Card text: "[On Play] If your Leader has the "Navy" type, draw 2 cards. [Activate: Main] [Once Per
 * Turn] You may trash 1 card from your hand: Give up to 1 rested DON!! card to your Leader or 1 of
 * your Characters."
 *
 * Rules: the Leader condition is read when the [On Play] resolves (a Leader "has" a type if it is
 * listed among its types). A given DON!! is taken from the cost area and attached; only a rested
 * one qualifies here. The cost is optional ("may"); an unpaid cost means no effect (CR 8-3-1-4).
 * [Once Per Turn] allows one activation per turn per card (CR 8-3-1-?).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  cast,
  deck,
  don,
  hand,
  kind,
  LB,
  mine,
  need,
  offeredAbilities,
  offeredIds,
  payHand,
  pickInst,
  SB,
  trash,
  yes,
} from './kit-op12b.ts';

const SAKAZUKI = 'OP12-044';
const TOP = [SB.marco, SB.kingdew, SB.thatch];
const rest = (n: number) => Array.from({ length: n }, () => SB.mohji);

describe('OP12-044 Sakazuki: [On Play] Navy Leader draws 2; [Activate: Main] trash 1, give a rested DON!!', () => {
  it('[On Play] with a {Navy} Leader draws 2 cards', () => {
    const g = mine(LB.navy, { hand: [SAKAZUKI], deck: [...TOP, ...rest(10)] });
    cast(g, SAKAZUKI);
    expect(hand(g)).toEqual([SB.marco, SB.kingdew].sort());
    expect(deck(g)).toHaveLength(11);
  });

  it('[On Play] with a Leader that has Navy among several types (Rosinante, Donquixote Pirates/Navy) draws 2', () => {
    const g = mine(LB.rosiLeader, { hand: [SAKAZUKI], deck: [...TOP, ...rest(10)] });
    cast(g, SAKAZUKI);
    expect(hand(g)).toHaveLength(2);
  });

  it('must not: with a Leader that is not {Navy} nothing is drawn', () => {
    const g = mine(LB.croc, { hand: [SAKAZUKI], deck: [...TOP, ...rest(10)] });
    cast(g, SAKAZUKI);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(13);
    expect(kind(g)).toBe('main');
  });

  it('[Activate: Main] trash 1, give 1 rested DON!! to my Leader: it moves from the rested cost area', () => {
    const g = mine(LB.croc, {
      hand: [SB.sai],
      characters: [SAKAZUKI],
      costArea: { active: 5, rested: 2 },
    });
    const sak = g.find('p1', 'characters', SAKAZUKI);
    act(g, { type: 'activate', card: sak, ability: offeredAbilities(g, sak)[0]! });
    payHand(g, [SB.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(SAKAZUKI);
    pickInst(g, [g.leader('p1')]);
    expect(trash(g)).toEqual([SB.sai]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g)).toMatchObject({ active: 5, rested: 1, given: 1 });
    // A given DON!! is +1000 power on my own turn.
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('can give to one of my Characters instead (and only my own cards are offered)', () => {
    const g = mine(
      LB.croc,
      { hand: [SB.sai], characters: [SAKAZUKI, SB.marco], costArea: { active: 3, rested: 1 } },
      { characters: [SB.kingdew] },
    );
    const sak = g.find('p1', 'characters', SAKAZUKI);
    act(g, { type: 'activate', card: sak, ability: offeredAbilities(g, sak)[0]! });
    payHand(g, [SB.sai]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SAKAZUKI, SB.marco, LB.croc].sort());
    pickInst(g, [g.find('p1', 'characters', SB.marco)]);
    expect(g.card(g.find('p1', 'characters', SB.marco)).don).toBe(1);
    expect(don(g)).toMatchObject({ active: 3, rested: 0, given: 1 });
  });

  it('only a RESTED DON!! is given: with only active DON!! none moves', () => {
    const g = mine(LB.croc, {
      hand: [SB.sai],
      characters: [SAKAZUKI],
      costArea: { active: 4, rested: 0 },
    });
    const sak = g.find('p1', 'characters', SAKAZUKI);
    act(g, { type: 'activate', card: sak, ability: offeredAbilities(g, sak)[0]! });
    if (kind(g) === 'optional') yes(g, 'p1');
    if (kind(g) === 'choose' && g.legal().some((a) => a.type === 'pick')) {
      // Cost pick (the hand card) then possibly an empty target pick: no DON!! may be offered.
      payHand(g, [SB.sai]);
    }
    expect(don(g)).toMatchObject({ active: 4, rested: 0, given: 0 });
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('the cost is exactly 1 card from hand (a cost pick of one card), and nothing moves before it is paid', () => {
    const g = mine(LB.croc, {
      hand: [SB.sai, SB.marco],
      characters: [SAKAZUKI],
      costArea: { active: 5, rested: 2 },
    });
    const sak = g.find('p1', 'characters', SAKAZUKI);
    act(g, { type: 'activate', card: sak, ability: offeredAbilities(g, sak)[0]! });
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    expect([d.min, d.max]).toEqual([1, 1]);
    expect(offeredIds(g)).toEqual([SB.marco, SB.sai].sort());
    expect(don(g)).toMatchObject({ rested: 2, given: 0 });
  });

  it('unpayable cost (empty hand): nothing is given', () => {
    const g = mine(LB.croc, { characters: [SAKAZUKI], costArea: { active: 5, rested: 2 } });
    const sak = g.find('p1', 'characters', SAKAZUKI);
    if (offeredAbilities(g, sak).length) {
      act(g, { type: 'activate', card: sak, ability: offeredAbilities(g, sak)[0]! });
      if (kind(g) === 'optional') {
        expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
        act(g, { type: 'optional', accept: false });
      }
    }
    expect(don(g)).toMatchObject({ rested: 2, given: 0 });
  });

  it('[Once Per Turn]: after one activation it is not offered again that turn', () => {
    const g = mine(LB.croc, {
      hand: [SB.sai, SB.marco],
      characters: [SAKAZUKI],
      costArea: { active: 5, rested: 3 },
    });
    const sak = g.find('p1', 'characters', SAKAZUKI);
    act(g, { type: 'activate', card: sak, ability: offeredAbilities(g, sak)[0]! });
    payHand(g, [SB.sai]);
    pickInst(g, [g.leader('p1')]);
    need(g, 'main', 'p1');
    expect(offeredAbilities(g, sak)).toEqual([]);
    expect(don(g)).toMatchObject({ rested: 2, given: 1 });
  });
});
