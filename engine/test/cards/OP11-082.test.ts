/** OP11-082 Aramaki. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import {
  activate,
  canHit,
  canPick,
  idsOf,
  mk,
  NAVY_B1,
  NAVY_LEADER,
  offeredAb,
} from './helpers-op11g3.ts';

const ID = 'OP11-082';

describe('OP11-082 Aramaki', () => {
  const start = (leader: string = NAVY_LEADER) =>
    mk({ leader, characters: [ID, NAVY_B1, V.c3] }, { characters: [V.c1] });

  it('[Activate: Main] trash this: a "Navy" Character can also attack active Characters; then trash 2 from the top of your deck', () => {
    const g = start();
    const navy = g.find('p1', 'characters', NAVY_B1);
    const target = g.find('p2', 'characters', V.c1);
    expect(canHit(g, navy, target)).toBe(false);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
    // Only a "Navy" Character is a candidate (not the non-Navy one, not Aramaki, now in the trash).
    expect(canPick(g, g.find('p1', 'characters', V.c3))).toBe(false);
    expect(canPick(g, navy)).toBe(true);
    pick(g, [navy]);
    expect(canHit(g, navy, target)).toBe(true);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'deck')).toHaveLength(8);
    expect(idsOf(g, 'p1', 'trash')).toHaveLength(3);
  });

  it('"up to 1": choosing nothing still trashes 2 cards from the deck', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(canHit(g, g.find('p1', 'characters', NAVY_B1), g.find('p2', 'characters', V.c1))).toBe(
      false,
    );
    expect(g.zone('p1', 'deck')).toHaveLength(8);
  });

  it('with a Leader that is not "Navy" nothing happens beyond the cost (no deck trashed)', () => {
    const g = start(PLAIN_BLUE);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(dec(g)?.kind).toBe('main');
    expect(idsOf(g, 'p1', 'trash')).toEqual([ID]);
    expect(g.zone('p1', 'deck')).toHaveLength(10);
  });

  it('with only 1 card in the deck it trashes that one', () => {
    const g = mk(
      { leader: NAVY_LEADER, characters: [ID, NAVY_B1], deck: [V.c1] },
      { characters: [V.c1] },
    );
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    expect(g.zone('p1', 'deck')).toHaveLength(0);
  });

  it('the activation is offered on the turn Aramaki is played', () => {
    const g = mk({ leader: NAVY_LEADER, characters: [{ card: ID, playedThisTurn: true }] });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(true);
  });
});
