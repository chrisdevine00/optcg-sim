/**
 * OP11-109 Pappag (Character, Yellow, cost 1, 0, Counter +1000, {Animal}/{Fish-Man Island}).
 *
 * Card text: "[On Play] If you have [Camie], draw 2 cards and trash 2 cards from your hand."
 *
 * Rules: CR 8-3-2 (If checked on resolution; "you have [Camie]" = a card with that name on my
 * field), CR 2-4 (name match is exact), CR 8-4-4 (the trash is an exact count of my choice).
 * Scenery: OP03-101 Camie (Yellow, cost 1, named [Camie], vanilla), EB05-012 Camie (Green, cost 3,
 * [On Play] rests an opposing Character: used only on the opposing side, played by nobody).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cnt,
  hand,
  kind,
  LD11,
  me,
  need,
  offeredIds,
  pickInst,
  playRaw,
  reachablePickSets,
  SC11,
  trash,
} from './kit-op11c.ts';

const ID = 'OP11-109';
const CAMIE = SC11.camieVan;

function start(
  o: { mine?: unknown[]; foe?: string[]; hand?: string[]; handHasCamie?: boolean } = {},
) {
  const g = me(
    LD11.plain,
    {
      hand: [ID, ...(o.hand ?? [SC11.r1]), ...(o.handHasCamie ? [CAMIE] : [])],
      characters: (o.mine as string[]) ?? [CAMIE],
      deck: [SC11.r2, SC11.r3, SC11.r4, SC11.r5, SC11.r6],
    },
    { characters: o.foe ?? [] },
  );
  playRaw(g, ID);
  return g;
}

describe('OP11-109 Pappag: with [Camie] on my field, draw 2 and trash 2', () => {
  it('printed effect: draw 2, then trash 2 cards of my choice from my hand', () => {
    const g = start();
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(2);
    expect(d.max).toBe(2);
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1), at(g, 'p1', 'hand', SC11.r2)]);
    expect(trash(g)).toEqual([SC11.r1, SC11.r2].sort());
    expect(hand(g)).toEqual([SC11.r3]);
    expect(kind(g)).toBe('main');
  });

  it('the 2 trashed cards may be any cards in hand, including the 2 just drawn', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(reachablePickSets(g).size).toBe(3);
    pickInst(g, [at(g, 'p1', 'hand', SC11.r2), at(g, 'p1', 'hand', SC11.r3)]);
    expect(hand(g)).toEqual([SC11.r1]);
  });

  it('the played Pappag is not in my hand and is not offered', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(ID);
  });

  it('without [Camie] on my field nothing is drawn or trashed', () => {
    const g = start({ mine: [] });
    expect(kind(g)).toBe('main');
    expect(cnt(g, 'p1', 'hand')).toBe(1);
    expect(cnt(g, 'p1', 'trash')).toBe(0);
  });

  it('a [Camie] in my hand does not count', () => {
    const g = start({ mine: [], handHasCamie: true });
    expect(kind(g)).toBe('main');
    expect(cnt(g, 'p1', 'hand')).toBe(2);
  });

  it('a [Camie] on my opponent’s field does not count', () => {
    const g = start({ mine: [], foe: [CAMIE] });
    expect(kind(g)).toBe('main');
    expect(cnt(g, 'p1', 'hand')).toBe(1);
  });

  it('a rested [Camie] still counts', () => {
    const g = start({ mine: [{ card: CAMIE, rested: true }] });
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1), at(g, 'p1', 'hand', SC11.r2)]);
    expect(cnt(g, 'p1', 'hand')).toBe(1);
  });

  it('a Character with another name does not count (a different Merfolk)', () => {
    const g = start({ mine: [SC11.merfolk3] });
    expect(kind(g)).toBe('main');
    expect(cnt(g, 'p1', 'hand')).toBe(1);
  });

  it('a different card named [Camie] (EB05-012) counts as well', () => {
    const g = start({ mine: ['EB05-012'] });
    need(g, 'choose', 'p1');
    expect(g.zone('p1', 'hand')).toHaveLength(3);
  });

  it('net hand: +2 drawn −2 trashed, and 2 cards leave my deck', () => {
    const g = start();
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1), at(g, 'p1', 'hand', SC11.r2)]);
    expect(cnt(g, 'p1', 'hand')).toBe(1);
    expect(g.zone('p1', 'deck')).toHaveLength(3);
  });
});
