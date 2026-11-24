/** OP17-010 Fossa. */
import { describe, expect, it } from 'vitest';
import { endCounter, expectDecision, game, PLAIN_BLUE, V } from './helpers.ts';
import { BIG10, RED_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-010';

describe('OP17-010 Fossa', () => {
  const start = (opp: Parameters<typeof game>[1]['characters'], mine: string[] = [ID]) =>
    game({ leader: RED_LEADER, characters: mine }, { leader: PLAIN_BLUE, characters: opp });
  const act = (g: ReturnType<typeof start>) =>
    g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'blocker' });
  const canAct = (g: ReturnType<typeof start>) =>
    g.isLegal({
      type: 'activate',
      card: g.find('p1', 'characters', ID),
      ability: 'blocker',
      player: 'p1',
    });

  it("[Activate: Main] with an opposing Character of 10000 power or more: gains [Blocker] and +2000 power until the end of the opponent's next End Phase", () => {
    const g = start([BIG10]);
    const fossa = g.find('p1', 'characters', ID);
    expect(canAct(g)).toBe(true);
    act(g);
    expect(g.card(fossa).keywords).toContain('Blocker');
    expect(g.power(fossa)).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(g.card(fossa).keywords).toContain('Blocker'); // still there on the opponent's turn
    expect(g.power(fossa)).toBe(5000);
    g.act({ type: 'endTurn' });
    expect(g.card(fossa).keywords).not.toContain('Blocker');
    expect(g.power(fossa)).toBe(3000);
  });

  it('the granted [Blocker] can block on the opponent turn', () => {
    const g = start([BIG10]);
    act(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', BIG10), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(
      g.isLegal({ type: 'block', blocker: g.find('p1', 'characters', ID), player: 'p1' }),
    ).toBe(true);
    void endCounter;
  });

  it('cannot be activated without an opposing Character with 10000 power or more (9000 is not enough)', () => {
    const g = start([V.c7]);
    expect(canAct(g)).toBe(false);
  });

  it('cannot be activated while you have another [Fossa]', () => {
    const g = start([BIG10], [ID, ID]);
    const first = g.find('p1', 'characters', ID, 0);
    const second = g.find('p1', 'characters', ID, 1);
    for (const card of [first, second])
      expect(g.isLegal({ type: 'activate', card, ability: 'blocker', player: 'p1' })).toBe(false);
  });

  it('is Once Per Turn', () => {
    const g = start([BIG10]);
    act(g);
    expect(canAct(g)).toBe(false);
  });
});
