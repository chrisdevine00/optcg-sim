/** OP10-110 Heat & Wire. */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  endCounter,
  expectDecision,
  game,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  rep,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-110';

describe('OP10-110 Heat & Wire: [On Play]', () => {
  const start = (theirLife: number) =>
    mk({ hand: [ID] }, { characters: [V.c1, V.c2, V.c3], life: rep(theirLife, V.c1) });

  it("rests an opposing Character with cost up to the number of your opponent's Life cards", () => {
    const g = start(2);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true); // cost 2 = Life 2: boundary
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('more Life raises the ceiling (3 Life reaches cost 3)', () => {
    const g = start(3);
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
  });

  it('your own Life does not count', () => {
    const g = mk(
      { hand: [ID], life: rep(5, V.c1) },
      { characters: [V.c1, V.c2, V.c3], life: [V.c1] },
    );
    play(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = start(3);
    play(g, ID);
    none(g);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('with 0 Life no Character with cost 1 or more is a target', () => {
    const g = start(0);
    play(g, ID);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(3);
  });
});

describe('OP10-110 Heat & Wire: [Trigger]', () => {
  const hit = (mine: number) => {
    const g = game(
      { leader: OTHER_LEADER, life: [ID, ...rep(mine - 1, V.c1)] },
      { leader: PLAIN_BLUE, characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    return g;
  };

  it('with 2 or less Life cards left it is played', () => {
    const g = hit(3); // 2 left after the damage
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('with 1 left it is played too', () => {
    const g = hit(2);
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('with 3 left it is not played', () => {
    const g = hit(4);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });
});
