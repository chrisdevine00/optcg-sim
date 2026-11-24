/** EB04-019 Eleclaw. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  endCounter,
  expectDecision,
  none,
  payDon,
  pick,
  play,
  takeDamage,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';
import { at, canPick, isRested, MINK1, MINKS_LEADER, mk, RED_LEADER, V } from './helpers-eb04g1.ts';

const ID = 'EB04-019';

describe('EB04-019 Eleclaw', () => {
  const start = (leader: string = MINKS_LEADER) =>
    mk(
      { leader, hand: [ID], characters: [MINK1], costArea: { active: 3, rested: 0 } },
      { characters: [V.c5, V.c3] },
    );

  it('[Main] you may rest 1 of your cards: with a {Minks} Leader, an opposing Character gets -3 cost during this turn', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [at(g, 'p1', 'characters', MINK1)]); // the cost
    expectDecision(g, 'choose', 'p1');
    pick(g, [at(g, 'p2', 'characters', V.c5)]);
    expect(g.card(at(g, 'p2', 'characters', V.c5)).cost).toBe(2);
    expect(g.card(at(g, 'p2', 'characters', V.c3)).cost).toBe(3);
    expect(isRested(g, at(g, 'p1', 'characters', MINK1))).toBe(true);
  });

  it('the cost can also be a DON!! or the Leader', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [at(g, 'p2', 'characters', V.c3)]);
    expect(g.card(at(g, 'p2', 'characters', V.c3)).cost).toBe(0);
  });

  it('"You may": declining the cost does nothing (the Event is still played)', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(g.card(at(g, 'p2', 'characters', V.c5)).cost).toBe(5);
    expect(isRested(g, at(g, 'p1', 'characters', MINK1))).toBe(false);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('with a Leader that is not {Minks} the cost is paid and the effect does nothing', () => {
    const g = start(RED_LEADER);
    play(g, ID);
    accept(g);
    pick(g, [at(g, 'p1', 'characters', MINK1)]);
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(at(g, 'p2', 'characters', V.c5)).cost).toBe(5);
    expect(isRested(g, at(g, 'p1', 'characters', MINK1))).toBe(true);
  });

  it('"up to 1": the target may be skipped after paying', () => {
    const g = start();
    play(g, ID);
    accept(g);
    pick(g, [at(g, 'p1', 'characters', MINK1)]);
    none(g);
    expect(g.card(at(g, 'p2', 'characters', V.c5)).cost).toBe(5);
  });

  it('[Counter]: a {Minks} Leader gains +3000 during this battle', () => {
    const g = counterStep({
      leader: MINKS_LEADER,
      hand: [ID],
      characters: [MINK1, V.c3],
      costArea: { active: 1, rested: 0 },
    });
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, at(g, 'p1', 'characters', MINK1))).toBe(true);
    expect(canPick(g, at(g, 'p1', 'characters', V.c3))).toBe(false); // not {Minks}
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Counter]: a Leader that is not {Minks} cannot be the target', () => {
    const g = counterStep({
      leader: RED_LEADER,
      hand: [ID],
      characters: [MINK1],
      costArea: { active: 1, rested: 0 },
    });
    useCounter(g, ID);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, at(g, 'p1', 'characters', MINK1))).toBe(true);
  });
});
