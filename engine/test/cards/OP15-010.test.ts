/** OP15-010 Nezumi. */
import { describe, expect, it } from 'vitest';
import {
  don,
  expectDecision,
  game,
  none,
  pick,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  PURPLE,
} from './helpers.ts';
import { activate, canPick, offeredAb } from './helpers-w3s.ts';

const ID = 'OP15-010';

describe('OP15-010 Nezumi', () => {
  const start = (rested: number, active = 0, chars: string[] = [PURPLE]) =>
    game(
      { leader: PLAIN_PURPLE, characters: [ID], costArea: { active: 1, rested: 1 } },
      { leader: PLAIN_BLUE, characters: chars, costArea: { active, rested } },
    );
  const go = (g: ReturnType<typeof start>) =>
    activate(g, g.find('p1', 'characters', ID), 'give-don');

  it('[Activate: Main] gives 1 of the opponent’s rested DON!! to their Character; none of yours is spent', () => {
    const g = start(2, 1);
    go(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ active: 1, rested: 1, given: 1 });
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1, given: 0 });
  });

  it('can go to the opponent’s Leader, and only to the opponent’s cards', () => {
    const g = start(1);
    go(g);
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', PURPLE))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(false);
    pick(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).don).toBe(1);
    expect(don(g, 'p2')).toMatchObject({ rested: 0, given: 1 });
  });

  it('"up to 1": nothing needs to be given', () => {
    const g = start(2);
    go(g);
    none(g);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 0 });
  });

  it('only rested DON!! are given: with none rested nothing happens', () => {
    const g = start(0, 3);
    go(g);
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 0, given: 0 });
    expectDecision(g, 'main', 'p1');
  });

  it('Once Per Turn', () => {
    const g = start(3);
    go(g);
    pick(g, [g.leader('p2')]);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(false);
    expect(don(g, 'p2')).toMatchObject({ rested: 2, given: 1 });
  });

  it('a given DON!! returns to its owner at their Refresh Phase', () => {
    const g = start(2);
    go(g);
    pick(g, [g.find('p2', 'characters', PURPLE)]);
    g.act({ type: 'endTurn' });
    expect(don(g, 'p2').given).toBe(0);
    expect(g.card(g.find('p2', 'characters', PURPLE)).don).toBe(0);
  });
});
