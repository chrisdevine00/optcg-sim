/** OP18-109 Fukurou. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, PLAIN_BLUE, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { mode } from './helpers-op14g3.ts';
import { CP_L, trig, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-109';

describe('OP18-109 Fukurou', () => {
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

  it('[Trigger] with a {CP} Leader: K.O. an opposing Character with a cost of 6 or less (7 is not a target)', () => {
    const g = trig(ID, {}, [V.c6, V.c3]);
    g.act({ type: 'trigger', activate: true });
    mode(g, 0);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false); // the attacker, cost 7
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(zoneOf(g, 'p2', 'trash')).toEqual([V.c6]);
  });

  it('or rest it', () => {
    const g = trig(ID, {}, [V.c6]);
    g.act({ type: 'trigger', activate: true });
    mode(g, 1);
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
    expect(zoneOf(g, 'p2', 'trash')).toEqual([]);
  });

  it('"up to 1": may choose nothing', () => {
    const g = trig(ID, {}, [V.c6]);
    g.act({ type: 'trigger', activate: true });
    mode(g, 0);
    none(g);
    expect(zoneOf(g, 'p2', 'characters')).toContain(V.c6);
  });

  it('without a {CP} Leader the [Trigger] does nothing', () => {
    const g = trig(ID, { leader: 'ST04-001' }, [V.c6]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'main', 'p2');
    expect(zoneOf(g, 'p2', 'characters')).toContain(V.c6);
  });
});
