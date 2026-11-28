/** OP18-107 Nero. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { CP_L, trig, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-107';

describe('OP18-107 Nero', () => {
  it('has [Blocker] and may block an attack on your Leader', () => {
    const g = game(
      { leader: CP_L, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c6] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c6), target: g.leader('p1') });
    const blocker = g.find('p1', 'characters', ID);
    expect(g.card(blocker).keywords).toContain('Blocker');
    g.act({ type: 'block', blocker });
    expect(g.card(blocker).rested).toBe(true);
  });

  it("[Trigger] with a {CP} Leader: place a Character with a cost of 5 or less at the bottom of its owner's deck", () => {
    const g = trig(ID, { characters: [V.c3] }, [V.c5, V.c6]);
    g.act({ type: 'trigger', activate: true });
    expect(candidates(g).sort()).toEqual(
      [g.find('p1', 'characters', V.c3), g.find('p2', 'characters', V.c5)].sort(),
    ); // cost 6 and the attacker (7) are not offered
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(zoneOf(g, 'p1', 'deck').at(-1)).toBe(V.c3);
    expect(zoneOf(g, 'p1', 'characters')).toEqual([]);
  });

  it("the boundary: a cost 5 Character of the opponent goes to the bottom of the opponent's deck", () => {
    const g = trig(ID, {}, [V.c5]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(zoneOf(g, 'p2', 'deck').at(-1)).toBe(V.c5);
  });

  it('"up to 1": may place nothing', () => {
    const g = trig(ID, {}, [V.c5]);
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(zoneOf(g, 'p2', 'characters')).toContain(V.c5);
  });

  it('without a {CP} Leader the [Trigger] does nothing', () => {
    const g = trig(ID, { leader: 'ST04-001' }, [V.c5]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'main', 'p2');
    expect(zoneOf(g, 'p2', 'characters')).toContain(V.c5);
  });
});
