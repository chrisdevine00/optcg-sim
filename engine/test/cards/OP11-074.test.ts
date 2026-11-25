/** OP11-074 Streusen. */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../src/testing.ts';
import { don, payDon, V } from './helpers.ts';
import {
  activate,
  atMain,
  lowerCost,
  mine,
  nameCost,
  offeredAb,
  offeredPicks,
  revealGame,
} from './helpers-w5c2.ts';

const ID = 'OP11-074';
const mk = (top: string = V.c4, p2chars: unknown[] = [V.c4, V.c5], p1: object = {}) =>
  revealGame({ characters: [ID, V.c1], ...p1 }, { characters: p2chars as never }, top);
const go = (g: ReturnType<typeof mk>) => {
  activate(g, mine(g, ID), 'choose-cost');
  payDon(g);
};

describe('OP11-074 Streusen', () => {
  it('[Activate: Main]: DON!! -1 and rest this Character; on a match rest up to 1 Character with cost 4 or less', () => {
    const g = mk(V.c4);
    const before = don(g, 'p1');
    go(g);
    expect(g.card(mine(g, ID)).rested).toBe(true);
    expect(before.active + before.rested - (don(g, 'p1').active + don(g, 'p1').rested)).toBe(1);
    nameCost(g, 4);
    // Cost 4 is the boundary: the cost-4 Character is offered, the cost-5 one is not.
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c4)]);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c4) });
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
    expect(g.zone('p2', 'deck')[0]!.card).toBe(V.c4);
  });

  it('a miss: the cost is paid, nothing is rested, nothing more is asked', () => {
    const g = mk(V.c4);
    go(g);
    nameCost(g, 5);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
    expect(g.card(mine(g, ID)).rested).toBe(true);
  });

  it('"up to 1": at most one Character is rested even when two are eligible', () => {
    const g = mk(V.c4, [V.c4, V.c3]);
    go(g);
    nameCost(g, 4);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c4) });
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('reads the current cost: a cost-5 Character lowered to 4 can be rested', () => {
    const g = mk(V.c4, [V.c5]);
    lowerCost(g, 'p2', V.c5, -1);
    go(g);
    nameCost(g, 4);
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c5)]);
  });

  it('"up to 1": may rest nothing; the Leader is never a target', () => {
    const g = mk(V.c4);
    go(g);
    nameCost(g, 4);
    expect(offeredPicks(g)).not.toContain(g.leader('p2'));
    g.act({ type: 'done' });
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  it('[Once Per Turn], and not offered while rested or with no DON!! to return', () => {
    const g = mk(V.c4, [V.c4], { costArea: { active: 3, rested: 0 } });
    go(g);
    nameCost(g, 4);
    g.act({ type: 'done' });
    expect(offeredAb(g, mine(g, ID), 'choose-cost')).toBe(false);
    // Once Per Turn, not just the rest cost: even set active again it is not offered.
    g.state = withAbilities(g.state, V.c1, [
      {
        id: 'untap',
        kind: 'activate',
        when: 'activateMain',
        effect: [
          { do: { setActive: { from: 'characters', owner: 'you', filter: { name: 'Streusen' } } } },
        ],
      } as Ability,
    ]);
    g.act({ type: 'activate', card: mine(g, V.c1), ability: 'untap' });
    expect(g.card(mine(g, ID)).rested).toBe(false);
    expect(offeredAb(g, mine(g, ID), 'choose-cost')).toBe(false);

    const rested = mk(V.c4, [V.c4], { characters: [{ card: ID, rested: true }] });
    expect(offeredAb(rested, mine(rested, ID), 'choose-cost')).toBe(false);

    const noDon = mk(V.c4, [V.c4], { costArea: { active: 0, rested: 0 } });
    expect(offeredAb(noDon, mine(noDon, ID), 'choose-cost')).toBe(false);
  });
});
