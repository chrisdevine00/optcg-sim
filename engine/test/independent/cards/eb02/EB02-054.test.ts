/**
 * EB02-054 Sanji (Yellow Character, cost 5, 6000, Counter +1000, {Straw Hat Crew}/{East Blue}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] If you have 2 or less Life cards, draw 2 cards and trash 1 card from
 * your hand."
 *
 * Rules: the condition counts the Life cards when the effect resolves (0, 1 and 2 pass, 3 fails); the
 * trash is exactly 1 card (not "up to") chosen from the whole hand, including the 2 cards just drawn;
 * [Blocker] lets the Character rest to take over an attack (CR 10-1-4).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  canFinish,
  deck,
  hand,
  kind,
  LE,
  mine,
  need,
  noDefence,
  offeredIds,
  pickCards,
  playRaw,
  SE,
  theirs,
  trash,
  kw,
  choices,
  decision,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const SANJI = 'EB02-054';
const TOP = [SE.marco, SE.kingdew];

function start(life: number, inHand: string[] = [SE.mohji]) {
  const g = mine(LE.luffy, {
    hand: [SANJI, ...inHand],
    life: Array(life).fill(SE.mohji),
    deck: [...TOP, ...Array(10).fill(SE.komachiyo)],
  });
  playRaw(g, SANJI);
  return g;
}

describe('EB02-054 Sanji: printed values and [Blocker]', () => {
  it('cost 5, 6000 power, Counter +1000, [Blocker]', () => {
    const g = mine(LE.luffy, { characters: [SANJI] });
    const s = ch(g, 'p1', SANJI);
    expect(g.card(s).cost).toBe(5);
    expect(g.power(s)).toBe(6000);
    expect(g.card(s).counter).toBe(1000);
    expect(kw(g, s)).toContain('Blocker');
  });

  it('blocks an attack on the Leader', () => {
    const g = theirs(LE.luffy, { characters: [SANJI] });
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([ch(g, 'p1', SANJI)]);
    act(g, { type: 'block', blocker: ch(g, 'p1', SANJI) });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });
});

describe('EB02-054 Sanji: [On Play] with 2 or less Life, draw 2 and trash 1', () => {
  it('2 Life (boundary): draws the top 2 cards, then asks to trash 1 card from the hand', () => {
    const g = start(2);
    need(g, 'choose', 'p1');
    expect(deck(g)[0]).toBe(SE.komachiyo);
    expect(hand(g)).toEqual([SE.mohji, ...TOP].sort());
    expect(offeredIds(g)).toEqual([SE.mohji, ...TOP].sort());
  });

  it('the trash is exactly 1 card and the hand ends 1 card larger than before', () => {
    const g = start(2);
    expect(canFinish(g)).toBe(false);
    pickCards(g, [SE.mohji]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([...TOP].sort());
    expect(trash(g)).toEqual([SE.mohji]);
  });

  it('may trash a card just drawn', () => {
    const g = start(2);
    pickCards(g, [SE.kingdew]);
    expect(hand(g)).toEqual([SE.mohji, SE.marco].sort());
    expect(trash(g)).toEqual([SE.kingdew]);
  });

  it('1 Life: the effect applies', () => {
    const g = start(1);
    need(g, 'choose', 'p1');
    pickCards(g, [SE.mohji]);
    expect(hand(g)).toHaveLength(2);
  });

  it('0 Life: the effect applies', () => {
    const g = start(0);
    need(g, 'choose', 'p1');
    pickCards(g, [SE.mohji]);
    expect(hand(g)).toHaveLength(2);
  });

  it('3 Life (boundary): nothing is drawn or trashed', () => {
    const g = start(3);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SE.mohji]);
    expect(deck(g)[0]).toBe(SE.marco);
    expect(trash(g)).toEqual([]);
  });

  it('4 Life: nothing is drawn or trashed', () => {
    const g = start(4);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SE.mohji]);
    expect(trash(g)).toEqual([]);
  });

  it('with no other card in hand the 2 drawn cards are the candidates and 1 is trashed', () => {
    const g = start(2, []);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([...TOP].sort());
    pickCards(g, [SE.marco]);
    expect(hand(g)).toEqual([SE.kingdew]);
    expect(trash(g)).toEqual([SE.marco]);
  });

  it('must not: the Life cards are not changed and Sanji stays on the field', () => {
    const g = start(2);
    pickCards(g, [SE.mohji]);
    expect(g.life('p1')).toBe(2);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SANJI]);
    expect(choices(g)).toEqual([]);
    expect(decision(g)?.kind).toBe('main');
  });
});
