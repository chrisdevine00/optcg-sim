/**
 * OP15-018 Mohji (Character, Red, cost 2, 3000, Counter +1000, {Buggy Pirates}/{East Blue}).
 *
 * Card text: "[When Attacking] K.O. up to 1 of your opponent's Characters with 3000 power or less
 * with a DON!! card given."
 *
 * Rules: CR 8-4-4-1 ("up to"), CR 6-5-5-2 (during my turn an opposing Character's given DON!! add
 * no power, so "3000 power or less" is read against its printed power plus any effects).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  cardIds,
  chr,
  donW,
  kind,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickInst,
  trash,
  W4,
} from './kit-w4a.ts';

const MOHJI = 'OP15-018';

function board(
  p2chars: (string | { card: string; rested?: boolean; don?: number })[],
  hand: string[] = [],
) {
  return mine('ST01-001', { characters: [MOHJI], hand }, { characters: p2chars });
}

function swing(g: ReturnType<typeof board>) {
  attack(g, chr(g, 'p1', MOHJI), g.leader('p2'));
}

describe('OP15-018 Mohji: [When Attacking] K.O. a Character with 3000 power or less and a DON!! given', () => {
  it('printed values: cost 2, 3000 power, Counter +1000', () => {
    const g = mine('ST01-001', { hand: [MOHJI] }, {});
    const c = g.card(at(g, 'p1', 'hand', MOHJI));
    expect(c.cost).toBe(2);
    expect(c.counter).toBe(1000);
    expect(g.card(at(g, 'p1', 'hand', MOHJI)).power).toBe(3000);
  });

  it('offers exactly the Characters with 3000 power or less AND a DON!! (boundary 3000 / 4000, with / without DON!!)', () => {
    const g = board([
      { card: W4.komachiyo, don: 1 },
      { card: W4.sai, don: 1 },
      { card: W4.alvida },
      { card: W4.whiteyBay, don: 1 },
      { card: W4.marco, don: 2 },
    ]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.komachiyo, W4.whiteyBay].sort());
  });

  it('K.O.s the chosen Character: it goes to the trash and its DON!! return rested', () => {
    const g = board([
      { card: W4.komachiyo, don: 2 },
      { card: W4.whiteyBay, don: 1 },
    ]);
    swing(g);
    pickInst(g, [chr(g, 'p2', W4.komachiyo)]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([W4.whiteyBay]);
    expect(trash(g, 'p2')).toEqual([W4.komachiyo]);
    expect(donW(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
  });

  it('"up to 1": K.O.s only one when two qualify, and may K.O. none', () => {
    const g = board([
      { card: W4.komachiyo, don: 1 },
      { card: W4.whiteyBay, don: 1 },
    ]);
    swing(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([W4.komachiyo, W4.whiteyBay].sort());
    const h = board([
      { card: W4.komachiyo, don: 1 },
      { card: W4.whiteyBay, don: 1 },
    ]);
    swing(h);
    pickInst(h, [chr(h, 'p2', W4.whiteyBay)]);
    expect(cardIds(h, 'p2', 'characters')).toEqual([W4.komachiyo]);
  });

  it('a rested Character qualifies the same way', () => {
    const g = board([{ card: W4.komachiyo, rested: true, don: 1 }]);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.komachiyo]);
  });

  it("the opponent's Leader is never a candidate even with a DON!! given and low power", () => {
    const g = mine(
      'ST01-001',
      { characters: [MOHJI] },
      { leader: { card: W4.luffy, don: 1 }, characters: [{ card: W4.komachiyo, don: 1 }] },
    );
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.komachiyo]);
  });

  it('with no qualifying Character nothing is K.O.d and the attack goes on to the Block Step', () => {
    const g = board([{ card: W4.marco, don: 1 }, { card: W4.komachiyo }]);
    swing(g);
    // The engine may ask an empty "up to" pick; answering it is the only thing it can want.
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(kind(g)).toBe('block');
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([W4.komachiyo, W4.marco].sort());
  });

  it('the K.O. happens before blocks: after it the battle continues normally', () => {
    const g = board([{ card: W4.komachiyo, don: 1 }]);
    swing(g);
    pickInst(g, [chr(g, 'p2', W4.komachiyo)]);
    expect(kind(g)).toBe('block');
    passBlock(g);
  });

  it('the effect does not trigger on a plain play or when Mohji is not attacking', () => {
    const g = mine('ST01-001', { hand: [MOHJI] }, { characters: [{ card: W4.komachiyo, don: 1 }] });
    g.act({ type: 'playCard', card: at(g, 'p1', 'hand', MOHJI) });
    expect(atMain(g, 'p1')).toBe(true);
    expect(cardIds(g, 'p2', 'characters')).toEqual([W4.komachiyo]);
  });
});
