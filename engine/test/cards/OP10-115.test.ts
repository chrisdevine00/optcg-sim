/** OP10-115 Let's Meet Again in the New World. */
import { describe, expect, it } from 'vitest';
import { dec, endCounter, hand, none, pick, V } from './helpers.ts';
import { canPick, cardsOf, counterGame, finish, trigAgainst, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-115';
/** A 5000-power attacker: the Leader with +4000 (9000) holds. */
const ATT = V.c3;

describe("OP10-115 Let's Meet Again in the New World", () => {
  it('[Counter]: +4000 to your Leader this battle; with 0 Life cards also draw 1', () => {
    const g = counterGame(ID, { life: [], deck: [V.c4, V.c5] }, {}, true, ATT);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(hand(g, 'p1')).toEqual([V.c4]);
    endCounter(g);
    finish(g);
    expect(g.life('p1')).toBe(0);
    expect(dec(g)?.kind).not.toBe(undefined); // the game goes on: 9000 held against 5000
  });

  it('must not draw with 1 Life card (boundary)', () => {
    const g = counterGame(ID, { life: [V.c1], deck: [V.c4, V.c5] }, {}, true, ATT);
    pick(g, [g.leader('p1')]);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('"Then" is not "if you do": the card is drawn even when the +4000 was declined', () => {
    const g = counterGame(ID, { life: [], deck: [V.c4, V.c5] }, {}, true, ATT);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g, 'p1')).toEqual([V.c4]);
  });

  it('[Trigger]: K.O. an opponent Character with a cost equal to or less than the number of their Life cards', () => {
    const g = trigGame(ID, {}, [V.c3, V.c4]); // the opponent has 3 Life cards
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // cost 3: equal
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false); // cost 4: more
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7, V.c4]);
    finish(g);
  });

  it('[Trigger]: with 1 Life card only a Character of cost 1 or less qualifies; with 0 Life none does', () => {
    const g = trigAgainst(ID, { life: [V.c1], characters: [V.c1, V.c2] });
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    const h = trigAgainst(ID, { life: [], characters: [V.c1] });
    h.act({ type: 'trigger', activate: true });
    expect(dec(h)?.kind).not.toBe('choose');
    expect(cardsOf(h, 'p2', 'characters')).toEqual([V.c7, V.c1]);
  });

  it('[Trigger]: "up to 1": may K.O. nothing', () => {
    const g = trigGame(ID, {}, [V.c2]);
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7, V.c2]);
  });
});
