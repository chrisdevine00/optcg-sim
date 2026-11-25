/** OP10-098 Liberation. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import { dec, none, pick, play, trash, V } from './helpers.ts';
import { canPick, cardsOf, start, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-098';

/** p1 has `mine` Characters, the opponent `theirs`. This Event costs 6. */
const main = (mine: string[], theirs: string[]) =>
  start({ hand: [ID], characters: mine }, { characters: theirs });

describe('OP10-098 Liberation', () => {
  it('[Main]: with 2 fewer Characters than the opponent, K.O. a base cost 6 or less and a base cost 4 or less', () => {
    const g = main([V.c1], [V.c6, V.c7, V.c4]); // 1 vs 3: exactly 2 fewer
    play(g, ID);
    // The cost-4 pick is asked first (B3B-R2): choosing it first can never lose the second K.O.
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false); // base cost 7
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7]);
    expect(trash(g, 'p2')).toEqual([V.c6, V.c4]); // top of the trash first
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('the first K.O. only reaches base cost 4 or less: a cost 5 or 6 Character is not offered it', () => {
    const g = main([], [V.c6, V.c5, V.c4]);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    pick(g, [g.find('p2', 'characters', V.c5)]); // the second pick reaches 6 or less
    expect(dec(g)?.kind).not.toBe('choose');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('must not do anything with only 1 fewer Character (boundary), equal or more', () => {
    const g = main([V.c1], [V.c6, V.c4]); // 1 vs 2
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6, V.c4]);
    expect(trash(g, 'p1')).toEqual([ID]);
    const h = main([V.c1, V.c2], [V.c6]);
    play(h, ID);
    expect(cardsOf(h, 'p2', 'characters')).toEqual([V.c6]);
  });

  it('reads the base cost: a Character whose cost was raised above 6 is still a target', () => {
    const g = main([], [V.c6, V.c4]);
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'cost',
        target: g.find('p2', 'characters', V.c6),
        amount: 3,
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p2',
      },
    }).state;
    expect(g.card(g.find('p2', 'characters', V.c6)).cost).toBe(9);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(true); // base cost 6, current 9
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([]);
  });

  it('"up to 1" each: either K.O. may be declined', () => {
    const g = main([], [V.c6, V.c4]);
    play(g, ID);
    none(g);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c6]);
    const h = main([], [V.c6, V.c4]);
    play(h, ID);
    pick(h, [h.find('p2', 'characters', V.c4)]);
    none(h);
    expect(cardsOf(h, 'p2', 'characters')).toEqual([V.c6]);
  });

  it("[Trigger]: negate the effect of up to 1 of each of the opponent's Leader and Character cards this turn", () => {
    const g = trigGame(ID, {}, [V.c3]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    pick(g, [g.leader('p2')]);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false); // the Leader was the first pick
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(dec(g)?.kind).not.toBe('trigger');
  });
});
