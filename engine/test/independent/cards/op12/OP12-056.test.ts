/**
 * OP12-056 Monkey.D.Garp (Character, Blue, cost 8, 8000, no Counter, {Navy}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: Play up to 1 blue "Navy" type Character
 * card with 8000 power or less other than [Monkey.D.Garp] from your hand."
 *
 * Rules: an optional cost (CR 8-3-1-4); the card is chosen from the hand AFTER the cost is paid, so
 * the trashed card is not a candidate. Only Character cards that are blue AND {Navy}, with printed
 * power 8000 or less, whose name is not [Monkey.D.Garp]. "Up to 1" may be none. A card played by
 * an effect pays no cost and enters active (CR 3-7-1).
 */
import { describe, expect, it } from 'vitest';
import {
  cast,
  chars,
  don,
  hand,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickInst,
  SB,
  trash,
  yes,
} from './kit-op12b.ts';

const GARP = 'OP12-056';
/** OP05-054 Monkey.D.Garp: Blue {Navy} Character, cost 3, 3000. Named [Monkey.D.Garp], so excluded. */
const GARP_OTHER = 'OP05-054';
/** OP12-057 Ice Block Pheasant Peck: Blue {Navy} Event. */
const NAVY_EVENT = 'OP12-057';

/** p1 plays Garp with `h` in hand and pays `pay`. Stops at the choice of the card to play. */
function afterCost(h: string[], pay: string) {
  const g = mine(LB.croc, { hand: [GARP, ...h] });
  cast(g, GARP);
  yes(g, 'p1');
  payHand(g, [pay]);
  return g;
}

describe('OP12-056 Monkey.D.Garp: [On Play] trash 1: play a blue Navy Character with 8000 power or less from hand', () => {
  it('offers exactly the blue {Navy} Characters with 8000 power or less (boundary 8000 in, 10000 out)', () => {
    const g = afterCost(
      [
        SB.sai,
        SB.navyBlue4,
        SB.navyBlue7,
        SB.navyBlue8,
        SB.navyBlack1,
        SB.mohji,
        GARP_OTHER,
        NAVY_EVENT,
      ],
      SB.sai,
    );
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.navyBlue4, SB.navyBlue7].sort());
  });

  it('plays the chosen card active; Garp stays; the trashed card is in the trash', () => {
    const g = afterCost([SB.sai, SB.navyBlue4], SB.sai);
    pickInst(g, [g.find('p1', 'hand', SB.navyBlue4)]);
    expect(chars(g)).toEqual([GARP, SB.navyBlue4].sort());
    expect(g.card(g.find('p1', 'characters', SB.navyBlue4)).rested).toBe(false);
    expect(trash(g)).toEqual([SB.sai]);
    expect(hand(g)).toEqual([]);
  });

  it('the played card is put into play without paying its cost (DON!! unchanged apart from Garp)', () => {
    const g = afterCost([SB.sai, SB.navyBlue7], SB.sai);
    pickInst(g, [g.find('p1', 'hand', SB.navyBlue7)]);
    // Garp's cost 8 leaves 2 active DON!! of 10; the cost-7 card was put in without paying more.
    expect(chars(g)).toEqual([GARP, SB.navyBlue7].sort());
    expect(don(g)).toMatchObject({ active: 2, rested: 8 });
  });

  it('a card with 8000 power exactly (Hina EB05-026) can be played', () => {
    const g = afterCost([SB.sai, SB.navyBlue7], SB.sai);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SB.navyBlue7]);
  });

  it('must not: a 10000-power blue Navy Character (John Giant) is not offered; nothing can be played', () => {
    const g = afterCost([SB.sai, SB.navyBlue8], SB.sai);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g)).toEqual([GARP]);
    expect(hand(g)).toEqual([SB.navyBlue8]);
  });

  it('must not: [Monkey.D.Garp] by name (OP05-054) and a Navy Event are not candidates', () => {
    const g = afterCost([SB.sai, GARP_OTHER, NAVY_EVENT], SB.sai);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g)).toEqual([GARP]);
  });

  it('the card trashed as the cost is not a candidate: paying with the only candidate leaves nothing to play', () => {
    const g = afterCost([SB.navyBlue4], SB.navyBlue4);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(trash(g)).toEqual([SB.navyBlue4]);
    expect(chars(g)).toEqual([GARP]);
  });

  it('"up to 1": after paying the player may play nothing', () => {
    const g = afterCost([SB.sai, SB.navyBlue4], SB.sai);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([GARP]);
    expect(hand(g)).toEqual([SB.navyBlue4]);
    expect(trash(g)).toEqual([SB.sai]);
  });

  it('Character area full (Garp + 4 others): playing the 6th asks me to trash one of my Characters first', () => {
    const g = mine(LB.croc, {
      hand: [GARP, SB.sai, SB.navyBlue4],
      characters: [SB.marco, SB.kingdew, SB.hajrudin, SB.thatch],
    });
    cast(g, GARP);
    yes(g, 'p1');
    payHand(g, [SB.sai]);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', SB.navyBlue4)]);
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('characterLimit');
    pickInst(g, [g.find('p1', 'characters', SB.kingdew)]);
    expect(chars(g)).toEqual([GARP, SB.marco, SB.hajrudin, SB.thatch, SB.navyBlue4].sort());
    expect(trash(g)).toEqual([SB.kingdew, SB.sai].sort());
  });

  it('"you may": declining the cost trashes nothing and plays nothing', () => {
    const g = mine(LB.croc, { hand: [GARP, SB.sai, SB.navyBlue4] });
    cast(g, GARP);
    no(g, 'p1');
    expect(trash(g)).toEqual([]);
    expect(chars(g)).toEqual([GARP]);
    expect(hand(g)).toEqual([SB.navyBlue4, SB.sai].sort());
  });

  it('unpayable cost (empty hand): the effect cannot be used', () => {
    const g = mine(LB.croc, { hand: [GARP] });
    cast(g, GARP);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      no(g, 'p1');
    }
    expect(chars(g)).toEqual([GARP]);
  });
});
