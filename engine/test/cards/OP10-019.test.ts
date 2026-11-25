/** OP10-019 Divine Departure. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  don,
  endCounter,
  expectDecision,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { canPick, cardsOf, counterGame, finish, start } from './helpers-a10g4.ts';

const ID = 'OP10-019';

const main = (oppChars: string[], active = 10) =>
  start(
    { hand: [ID], characters: [V.c6], costArea: { active, rested: 0 } },
    { characters: oppChars },
  );

describe('OP10-019 Divine Departure', () => {
  it('[Main]: rest 5 DON!!: K.O. an opponent Character with 8000 power or less (boundary), not 9000', () => {
    const g = main([V.c6, V.c7, V.c4]);
    play(g, ID); // cost 1
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(true); // 8000
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false); // 9000
    expect(canPick(g, g.find('p1', 'characters', V.c6))).toBe(false); // your own
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7, V.c4]);
    expect(trash(g, 'p2')).toEqual([V.c6]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it("declining the optional cost does nothing: the Event is played and nothing is K.O.'d", () => {
    const g = main([V.c4]);
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c4]);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it("with fewer than 5 active DON!! left after the Event's own cost the cost cannot be paid", () => {
    const g = main([V.c4], 5); // 5 - 1 = 4 active
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
    if (dec(g)?.kind === 'optional') decline(g);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c4]);
  });

  it('with only a 9000 target the K.O. finds nothing', () => {
    const g = main([V.c7]);
    play(g, ID);
    accept(g);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7]);
  });

  it('[Counter]: your Leader gains +3000 power during this battle', () => {
    const g = counterGame(ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    finish(g);
    expect(g.life('p1')).toBe(2); // 8000 < 9000: the Leader still takes the hit
    expect(g.power(g.leader('p1'))).toBe(5000); // the +3000 ended with the battle
    const h = counterGame(ID, {}, {}, true, V.c5); // 7000 attacker: 8000 holds
    pick(h, [h.leader('p1')]);
    endCounter(h);
    finish(h);
    expect(h.life('p1')).toBe(3);
  });
});
