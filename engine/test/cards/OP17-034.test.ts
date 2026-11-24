/** OP17-034 Rockstar. */
import { describe, expect, it } from 'vitest';
import { don, game } from './helpers.ts';
import { OTHER_LEADER, SHANKS_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-034';
/** OP11-040 Blue/Purple Leader, 6000 power; its effect works at the start of its owner's turn only. */
const BIG_LEADER = 'OP11-040';

describe('OP17-034 Rockstar', () => {
  const start = (mine: string, theirs: string) =>
    game(
      { leader: mine, characters: [ID], costArea: { active: 0, rested: 2 } },
      { leader: theirs },
    );
  const activate = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'rockstar' });

  it("with an opponent's Leader of 6000 power or more: set 1 DON!! active, then your {Red-Haired Pirates} Leader's base power becomes 6000", () => {
    const g = start(SHANKS_LEADER, BIG_LEADER);
    expect(g.power(g.leader('p1'))).toBe(5000);
    activate(g);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it("the base power lasts until the end of the opponent's next End Phase", () => {
    const g = start(SHANKS_LEADER, BIG_LEADER);
    activate(g);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(6000);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('once per turn', () => {
    const g = start(SHANKS_LEADER, BIG_LEADER);
    activate(g);
    expect(
      g.isLegal({
        type: 'activate',
        card: g.find('p1', 'characters', ID),
        ability: 'rockstar',
        player: 'p1',
      }),
    ).toBe(false);
  });

  it("with an opponent's Leader below 6000 power the ability cannot be activated", () => {
    const g = start(SHANKS_LEADER, 'ST03-001');
    expect(
      g.isLegal({
        type: 'activate',
        card: g.find('p1', 'characters', ID),
        ability: 'rockstar',
        player: 'p1',
      }),
    ).toBe(false);
  });

  it('a Leader that is not {Red-Haired Pirates} keeps its power, the DON!! is still set active', () => {
    const g = start(OTHER_LEADER, BIG_LEADER);
    const before = g.power(g.leader('p1'));
    activate(g);
    expect(don(g, 'p1').active).toBe(1);
    expect(g.power(g.leader('p1'))).toBe(before);
  });
});
