/**
 * EB04-018 Megalo (Character, cost 4, 4000, Counter +2000, {Animal}/{Fish-Man Island}).
 *
 * Card text: "[On Play] You may rest this Character: K.O. up to 1 of your opponent's rested Characters
 * with 8000 power or less."
 *
 * Rules: CR 8-3-1-3/-4 (optional cost: resting this Character), "up to 1" (CR 8-4-4-1), only RESTED
 * opposing Characters qualify, "8000 power or less" is the current power.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cardIds,
  choices,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SN,
  trash,
  yes,
} from './kit-eb04a.ts';

const MEGALO = 'EB04-018';
const rest = (card: string, don = 0) => ({ card, rested: true, don });

function start(p2chars: Array<string | { card: string; rested?: boolean; don?: number }>) {
  const g = mine(LE.luffy, { hand: [MEGALO] }, { characters: p2chars });
  playRaw(g, MEGALO);
  return g;
}
const megalo = (g: ReturnType<typeof start>) => at(g, 'p1', 'characters', MEGALO);

describe('EB04-018 Megalo: [On Play] you may rest this Character: K.O. up to 1 opposing rested Character with 8000 power or less', () => {
  it('printed values: cost 4, 4000, Counter +2000', () => {
    const g = mine(LE.luffy, { hand: [MEGALO] }, {});
    const c = g.card(g.find('p1', 'hand', MEGALO));
    expect(c.cost).toBe(4);
    expect(c.power).toBe(4000);
    expect(c.counter).toBe(2000);
  });

  it('rests itself and K.O.s a rested 8000-power Character (the boundary)', () => {
    const g = start([rest(SN.c6)]);
    yes(g, 'p1');
    need(g, 'choose');
    pickInst(g, [at(g, 'p2', 'characters', SN.c6)]);
    expect(kind(g)).toBe('main');
    expect(g.card(megalo(g)).rested).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SN.c6]);
  });

  it('only rested Characters with 8000 power or less are offered (an active one and a rested 9000 one are not)', () => {
    const g = start([rest(SN.c6), rest(SN.c7), SN.c4, rest(SN.c2)]);
    yes(g, 'p1');
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c2, SN.c6].sort());
    expect(mayChooseNone(g)).toBe(true);
    pickInst(g, [at(g, 'p2', 'characters', SN.c2)]);
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([SN.c4, SN.c6, SN.c7].sort());
  });

  it('"8000 power or less" is the current power: a rested 7000 Character with 2 DON!! (9000 on its turn only) is still 7000 now', () => {
    const g = start([rest(SN.c5, 2)]);
    yes(g, 'p1');
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c5]);
    none(g);
  });

  it('"you may": declining the cost leaves Megalo active and K.O.s nothing', () => {
    const g = start([rest(SN.c6)]);
    no(g, 'p1');
    expect(kind(g)).toBe('main');
    expect(g.card(megalo(g)).rested).toBe(false);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SN.c6]);
  });

  it('"up to 1": after paying, choosing nobody K.O.s nothing (Megalo stays rested)', () => {
    const g = start([rest(SN.c6)]);
    yes(g, 'p1');
    need(g, 'choose');
    none(g);
    expect(g.card(megalo(g)).rested).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SN.c6]);
  });

  it("must not happen: with only active opposing Characters nothing can be K.O.'d", () => {
    const g = start([SN.c4, SN.c1]);
    yes(g, 'p1');
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      none(g);
    }
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([SN.c1, SN.c4].sort());
  });

  it('only opposing Characters are targets: my own rested Characters are not offered', () => {
    const g = mine(
      LE.luffy,
      { hand: [MEGALO], characters: [rest(SN.c2)] },
      { characters: [rest(SN.c3)] },
    );
    playRaw(g, MEGALO);
    yes(g, 'p1');
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.c3]);
    none(g);
  });
});
