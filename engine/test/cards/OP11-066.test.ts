/** OP11-066 Charlotte Oven. */
import { describe, expect, it } from 'vitest';
import { addMost, dec, don, expectDecision, V } from './helpers.ts';
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

const ID = 'OP11-066';
const mk = (top: string = V.c3, p2chars: string[] = [V.c3, V.c4], p1chars: unknown[] = [ID]) =>
  revealGame({ characters: p1chars as never }, { characters: p2chars }, top);
const go = (g: ReturnType<typeof mk>) => activate(g, mine(g, ID), 'choose-cost');

describe('OP11-066 Charlotte Oven', () => {
  it('[Activate: Main]: rests this Character; on a match K.O. up to 1 Character with base cost 3 or less, then add 1 DON!! rested', () => {
    const g = mk(V.c3);
    const before = don(g, 'p1');
    go(g);
    expect(g.card(mine(g, ID)).rested).toBe(true);
    nameCost(g, 3);
    // Base cost 3 is the boundary: the cost-3 Character is offered, the cost-4 one is not.
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c3)]);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c3) });
    addMost(g);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c4]);
    expect(don(g, 'p1')).toMatchObject({
      active: before.active,
      rested: before.rested + 1,
    });
    // The revealed card stays on top of the opponent's deck.
    expect(g.zone('p2', 'deck')[0]!.card).toBe(V.c3);
    expect(g.eventsOfType('CardRevealed').some((e) => e.reason === 'effect')).toBe(true);
  });

  it('"up to 1": at most one Character is K.O.\'d even when two are eligible', () => {
    const g = mk(V.c3, [V.c3, V.c3]);
    go(g);
    nameCost(g, 3);
    g.act({ type: 'pick', choice: g.find('p2', 'characters', V.c3, 0) });
    // Raw: the next question is the DON!! count, not a second K.O.
    addMost(g);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('a miss does nothing more: no K.O., no DON!!, no further question; the rest cost stays paid', () => {
    const g = mk(V.c3);
    const before = don(g, 'p1');
    go(g);
    nameCost(g, 4);
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(don(g, 'p1')).toEqual(before);
    expect(g.card(mine(g, ID)).rested).toBe(true);
  });

  it('compares the base cost: a Character whose cost was lowered to 3 is not a target', () => {
    const g = mk(V.c3, [V.c4]);
    lowerCost(g, 'p2', V.c4, -1);
    expect(g.card(g.find('p2', 'characters', V.c4)).cost).toBe(3);
    go(g);
    nameCost(g, 3);
    // "up to 1" with no legal target: the K.O. asks nothing; the DON!! still comes ("Then").
    expect(offeredPicks(g)).toEqual([]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('"Then" runs on a match even when no Character is K.O.\'d (none, or declined)', () => {
    const none = mk(V.c3, []);
    const b1 = don(none, 'p1');
    go(none);
    nameCost(none, 3);
    if (dec(none)?.kind === 'choose') addMost(none);
    expect(don(none, 'p1').rested).toBe(b1.rested + 1);

    const declined = mk(V.c3);
    const b2 = don(declined, 'p1');
    go(declined);
    nameCost(declined, 3);
    declined.act({ type: 'done' });
    addMost(declined);
    expect(declined.zone('p2', 'characters')).toHaveLength(2);
    expect(don(declined, 'p1').rested).toBe(b2.rested + 1);
  });

  it('cannot be activated while rested, and a Leader or an empty deck changes nothing it should not', () => {
    const g = mk(V.c3, [V.c3], [{ card: ID, rested: true }]);
    expect(offeredAb(g, mine(g, ID), 'choose-cost')).toBe(false);
    // An empty opponent deck reveals nothing, so no cost matches.
    const e = revealGame({ characters: [ID] }, { characters: [V.c3], deck: [] });
    go(e);
    nameCost(e, 0);
    expect(atMain(e)).toBe(true);
    expect(e.zone('p2', 'characters')).toHaveLength(1);
    expectDecision(e, 'main', 'p1');
  });
});
