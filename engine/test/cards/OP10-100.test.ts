/** OP10-100 Inazuma. */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  dec,
  endCounter,
  expectDecision,
  game,
  idsOf,
  none,
  OTHER_LEADER,
  passBlock,
  pick,
  PLAIN_BLUE,
  RA_LEADER,
  rep,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-100';

describe('OP10-100 Inazuma: [DON!! x1] [When Attacking]', () => {
  const start = (don: number, mine = 2, theirs = 2) =>
    game(
      {
        leader: OTHER_LEADER,
        characters: [{ card: ID, don }],
        life: rep(mine, V.c1),
        costArea: { active: 3, rested: 0 },
      },
      { leader: PLAIN_BLUE, characters: [V.c3, V.c4, V.c5], life: rep(theirs, V.c1) },
    );
  const attack = (g: ReturnType<typeof start>) =>
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

  it("rests an opposing Character with cost up to the total of both players' Life cards", () => {
    const g = start(1); // 2 + 2 = 4
    attack(g);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true); // cost 4 = total: boundary
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
    expect(dec(g)?.kind).toBe('block');
  });

  it('counts both players: 2 + 3 = 5 reaches cost 5', () => {
    const g = start(1, 2, 3);
    attack(g);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
  });

  it('a lower total lowers the ceiling (1 + 2 = 3)', () => {
    const g = start(1, 1, 2);
    attack(g);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = start(1);
    attack(g);
    none(g);
    expect(idsOf(g, 'p2', 'characters')).toHaveLength(3);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('must not fire without a DON!! card given', () => {
    const g = start(0);
    attack(g);
    expectDecision(g, 'block', 'p2');
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });
});

describe('OP10-100 Inazuma: [Trigger]', () => {
  /** p2 attacks p1's Leader; p1's top Life card is Inazuma and is taken as damage. */
  const hit = (leader: string, mine: number, theirs: number) => {
    const g = game(
      { leader, life: [ID, ...rep(mine - 1, V.c1)] },
      { leader: PLAIN_BLUE, characters: [V.c7], life: rep(theirs, V.c1) },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    endCounter(g);
    expectDecision(g, 'trigger', 'p1');
    g.act({ type: 'trigger', activate: true });
    return g;
  };

  it('with a Revolutionary Army Leader and a total of 5 Life cards left, it is played', () => {
    const g = hit(RA_LEADER, 3, 3); // 2 + 3 = 5 after the damage
    expect(idsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('a total of 6 is too many: it is not played', () => {
    const g = hit(RA_LEADER, 3, 4);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });

  it('must not be played without a Revolutionary Army Leader', () => {
    const g = hit(OTHER_LEADER, 3, 3);
    expect(idsOf(g, 'p1', 'characters')).toEqual([]);
  });
});
