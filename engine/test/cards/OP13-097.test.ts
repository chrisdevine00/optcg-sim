/** OP13-097 The World's Equilibrium Cannot Be Maintained Forever. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, don, none, pick, play, PLAIN_PURPLE, V } from './helpers.ts';
import { canPick, CD2, counterStep, mine, names, useCounter } from './helpers-op13g4.ts';

const ID = 'OP13-097';

describe("OP13-097 The World's Equilibrium Cannot Be Maintained Forever", () => {
  const run = (mine1: string[], opp: string[], active = 6) => {
    const g = mine(
      { leader: PLAIN_PURPLE, hand: [ID], characters: mine1 },
      { characters: opp },
      active,
    );
    play(g, ID);
    return g;
  };

  it('[Main] rest 5 DON!!: if you only have {Celestial Dragons} Characters, K.O. a base cost 6 or less Character', () => {
    const g = run([CD2], [V.c6, V.c7]);
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(names(g, 'p2', 'characters')).toEqual([V.c7]);
    expect(don(g, 'p1').rested).toBe(6);
  });

  it('base cost 7 is not a candidate (6 or less)', () => {
    const g = run([CD2], [V.c7]);
    accept(g);
    if (dec(g)?.kind === 'choose') expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    if (dec(g)?.kind === 'choose') none(g);
    expect(names(g, 'p2', 'characters')).toEqual([V.c7]);
  });

  it('with a non-{Celestial Dragons} Character on your field the DON!! is rested but nothing is K.O.d', () => {
    const g = run([CD2, V.c1], [V.c3]);
    accept(g);
    if (dec(g)?.kind === 'choose') none(g);
    expect(names(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(don(g, 'p1').rested).toBe(6);
  });

  it('with no Characters at all the condition is false', () => {
    const g = run([], [V.c3]);
    accept(g);
    if (dec(g)?.kind === 'choose') none(g);
    expect(names(g, 'p2', 'characters')).toEqual([V.c3]);
  });

  it('declining the optional DON!! rest skips the K.O.; with only 4 spare DON!! it cannot be accepted', () => {
    const g = run([CD2], [V.c3]);
    decline(g);
    expect(names(g, 'p2', 'characters')).toEqual([V.c3]);
    expect(don(g, 'p1').rested).toBe(1);
    const h = run([CD2], [V.c3], 5);
    expect(h.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  });

  it('[Counter] your Leader gains +3000 power during this battle', () => {
    const g = counterStep({
      leader: PLAIN_PURPLE,
      hand: [ID],
      costArea: { active: 3, rested: 0 },
    });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
  });
});
