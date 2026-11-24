/** OP11-107 Topknot Neptunian. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';
import { activate, canBlockWith, offeredAb, SHIRAHOSHI, up } from './helpers-op11g3.ts';

const ID = 'OP11-107';

describe('OP11-107 Topknot Neptunian', () => {
  const start = (
    leader: string = SHIRAHOSHI,
    life: Parameters<typeof game>[0]['life'] = [up(BLUE), up(BLUE), BLUE],
    rested = true,
  ) => game({ leader, life, characters: [{ card: ID, rested }] }, { leader: PLAIN_BLUE });

  it('[Activate: Main] [Once Per Turn] with [Shirahoshi]: turn the top Life face-down: set this Character as active at the end of this turn', () => {
    const g = start();
    const me = g.find('p1', 'characters', ID);
    activate(g, me, 'activate');
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(g.life('p1')).toBe(3);
    // Still rested for the rest of the turn.
    expect(g.card(me).rested).toBe(true);
    expectDecision(g, 'main', 'p1');
    g.act({ type: 'endTurn' });
    // Set active at the end of the turn, i.e. before p2's turn (p1's own Refresh has not happened).
    expect(g.card(me).rested).toBe(false);
  });

  it("without the ability the Character stays rested through the opponent's turn (control)", () => {
    const g = start();
    const me = g.find('p1', 'characters', ID);
    g.act({ type: 'endTurn' });
    expect(g.card(me).rested).toBe(true);
  });

  it('once per turn: not offered a second time', () => {
    const g = start();
    const me = g.find('p1', 'characters', ID);
    activate(g, me, 'activate');
    expect(offeredAb(g, me, 'activate')).toBe(false);
  });

  it('is not offered with a Leader that is not [Shirahoshi]', () => {
    const g = start(PLAIN_BLUE);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('is not offered when the top Life card is face-down', () => {
    const g = start(SHIRAHOSHI, [BLUE, up(BLUE)]);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('is offered even when already active (the activation does not require rested); it simply does nothing visible', () => {
    const g = start(SHIRAHOSHI, undefined, false);
    const me = g.find('p1', 'characters', ID);
    expect(offeredAb(g, me, 'activate')).toBe(true);
    activate(g, me, 'activate');
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(me).rested).toBe(false);
  });

  it('has [Blocker]', () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
