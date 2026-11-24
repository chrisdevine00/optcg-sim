/**
 * EB04-017 Mystoms (Character, cost 6, 5000, Counter +1000, {Minks}/{Big Mom Pirates}).
 *
 * Card text: "[Your Turn] If you have 3 or more {Minks} type Characters, give all of your opponent's
 * Characters −1 cost.
 * [On Play] If your Leader has the {Minks} type, play up to 1 {Minks} type Character card with a cost
 * of 5 or less from your hand."
 *
 * Rules: [Your Turn] applies on my turn only; Mystoms counts herself among the 3; the Leader is not a
 * Character; "up to 1" (CR 8-4-4-1); a played Character joins the count at once.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  cardIds,
  choices,
  endTurn,
  hand,
  kind,
  LE,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  SN,
  theirs,
} from './kit-eb04a.ts';

const MYSTOMS = 'EB04-017';
const cost = (g: ReturnType<typeof mine>, card: string) =>
  g.card(at(g, 'p2', 'characters', card)).cost;

describe('EB04-017 Mystoms: [Your Turn] with 3+ {Minks} Characters, the opponent Characters get -1 cost', () => {
  it('printed values: cost 6, 5000, Counter +1000', () => {
    const g = mine(LE.minks, { hand: [MYSTOMS] }, {});
    const c = g.card(g.find('p1', 'hand', MYSTOMS));
    expect(c.cost).toBe(6);
    expect(c.power).toBe(5000);
    expect(c.counter).toBe(1000);
  });

  it('3 {Minks} Characters (Mystoms included) on my turn: every opposing Character gets -1 cost', () => {
    const g = mine(
      LE.luffy,
      { characters: [MYSTOMS, SN.tristan, SN.bb] },
      { characters: [SN.c5, SN.c2] },
    );
    expect(cost(g, SN.c5)).toBe(4);
    expect(cost(g, SN.c2)).toBe(1);
  });

  it('boundary: only 2 {Minks} Characters (Mystoms and one more): no change', () => {
    const g = mine(LE.luffy, { characters: [MYSTOMS, SN.tristan, SN.c3] }, { characters: [SN.c5] });
    expect(cost(g, SN.c5)).toBe(5);
  });

  it('must not happen: on the opponent turn the reduction is not applied', () => {
    const g = theirs(
      LE.luffy,
      { characters: [MYSTOMS, SN.tristan, SN.bb] },
      { characters: [SN.c5] },
    );
    expect(g.card(at(g, 'p2', 'characters', SN.c5)).cost).toBe(5);
  });

  it('must not happen: the {Minks} Leader is not a Character, and the opponent {Minks} Characters do not count', () => {
    const g = mine(
      LE.minks,
      { characters: [MYSTOMS, SN.tristan] },
      { characters: [SN.c5, SN.bb, SN.pekoms] },
    );
    expect(cost(g, SN.c5)).toBe(5);
  });

  it('rested {Minks} Characters count', () => {
    const g = mine(
      LE.luffy,
      { characters: [MYSTOMS, { card: SN.tristan, rested: true }, { card: SN.bb, rested: true }] },
      { characters: [SN.c5] },
    );
    expect(cost(g, SN.c5)).toBe(4);
  });

  it('the reduction ends with my turn', () => {
    const g = mine(LE.luffy, { characters: [MYSTOMS, SN.tristan, SN.bb] }, { characters: [SN.c5] });
    expect(cost(g, SN.c5)).toBe(4);
    endTurn(g);
    expect(cost(g, SN.c5)).toBe(5);
  });
});

describe('EB04-017 Mystoms: [On Play] with a {Minks} Leader, play up to 1 {Minks} Character cost 5 or less from hand', () => {
  const start = (leader: string, h: string[], chars: string[] = []) => {
    const g = mine(leader, { hand: [MYSTOMS, ...h], characters: chars }, { characters: [SN.c5] });
    playRaw(g, MYSTOMS);
    return g;
  };

  it('plays the chosen {Minks} Character (cost 5 or less); other types and cost 6 are not offered', () => {
    const g = start(LE.minks, [SN.bb, SN.neko, SN.c3, SN.pekoms]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([SN.bb, SN.pekoms].sort());
    expect(mayChooseNone(g)).toBe(true);
    pickInst(g, [choices(g).find((i) => g.card(i).card === SN.bb)!]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([MYSTOMS, SN.bb].sort());
    expect(hand(g)).toEqual([SN.c3, SN.neko, SN.pekoms].sort());
  });

  it('boundary: a cost-3 {Minks} Character is fine; "up to 1": choosing none plays nothing', () => {
    const g = start(LE.minks, [SN.pekoms]);
    need(g, 'choose');
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([MYSTOMS]);
    expect(hand(g)).toEqual([SN.pekoms]);
  });

  it('must not happen: a Leader without {Minks} plays nothing and asks nothing', () => {
    const g = start(LE.luffy, [SN.bb]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([MYSTOMS]);
    expect(hand(g)).toEqual([SN.bb]);
  });

  it('no {Minks} Character of cost 5 or less in hand (even an empty hand): the "up to 1" pick is still asked, with nothing to choose', () => {
    for (const h of [[SN.neko, SN.c3], []]) {
      const g = start(LE.minks, h);
      need(g, 'choose', 'p1');
      expect(choices(g)).toEqual([]);
      none(g);
      expect(cardIds(g, 'p1', 'characters')).toEqual([MYSTOMS]);
    }
  });

  it('a cost-1 opposing Character shown with the reduction is 0, not negative', () => {
    const g = mine(LE.luffy, { characters: [MYSTOMS, SN.tristan, SN.bb] }, { characters: [SN.c1] });
    expect(cost(g, SN.c1)).toBe(0);
  });

  it('the Character played joins the count at once: Mystoms + 2 more {Minks} = 3, so the opposing Character costs 1 less', () => {
    const g = start(LE.minks, [SN.bb], [SN.tristan]);
    pickInst(g, [choices(g).find((i) => g.card(i).card === SN.bb)!]);
    expect(cost(g, SN.c5)).toBe(4);
  });
});
