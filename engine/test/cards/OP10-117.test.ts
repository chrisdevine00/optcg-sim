/** OP10-117 ROOM. */
import { describe, expect, it } from 'vitest';
import { dec, endCounter, hand, none, pick, V } from './helpers.ts';
import { canPick, counterGame, finish, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-117';
const rested = (card: string) => ({ card, rested: true });
/** A 5000-power attacker: the Leader with +3000 (8000) holds. */
const ATT = V.c3;
const isRested = (g: ReturnType<typeof counterGame>, card: string) =>
  g.zone('p1', 'characters').find((c) => c.card === card)!.rested;

const room = (life: string[], chars = [rested(V.c5), rested(V.c6), rested(V.c2)]) =>
  counterGame(ID, { life, characters: chars }, {}, true, ATT);

describe('OP10-117 ROOM', () => {
  it('[Counter]: with 1 Life card, +3000 to your Leader this battle, then set a Character with a cost of 5 or less as active', () => {
    const g = room([V.c1]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(canPick(g, g.find('p1', 'characters', V.c5))).toBe(true); // cost 5: boundary
    expect(canPick(g, g.find('p1', 'characters', V.c6))).toBe(false); // cost 6
    pick(g, [g.find('p1', 'characters', V.c5)]);
    expect(isRested(g, V.c5)).toBe(false);
    expect(isRested(g, V.c6)).toBe(true);
    endCounter(g);
    finish(g);
    expect(g.life('p1')).toBe(1); // 8000 held against 5000
  });

  it('with 0 Life cards it applies too', () => {
    const g = room([]);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(isRested(g, V.c2)).toBe(false);
  });

  it('must not do anything with 2 Life cards (boundary): no power, no set-active, nothing asked', () => {
    const g = room([V.c1, V.c1]);
    expect(dec(g)?.kind).toBe('counter');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(isRested(g, V.c5)).toBe(true);
  });

  it('"up to 1": either part may be declined ("Then" is inside the guard, not "if you do")', () => {
    const g = room([V.c1]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    pick(g, [g.find('p1', 'characters', V.c5)]);
    expect(isRested(g, V.c5)).toBe(false);
    const h = room([V.c1]);
    pick(h, [h.leader('p1')]);
    none(h);
    expect(isRested(h, V.c5)).toBe(true);
  });

  it('[Trigger]: draw 1 card', () => {
    const g = trigGame(ID, { deck: [V.c4, V.c5] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c4]);
  });
});
