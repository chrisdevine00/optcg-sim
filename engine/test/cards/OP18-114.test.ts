/** OP18-114 Wanze. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, game, hand, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { candidates } from './helpers-a10g1.ts';
import { CP_L, trig, zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-114';

describe('OP18-114 Wanze', () => {
  const start = () =>
    game(
      { leader: CP_L, hand: [ID], life: [V.c3, V.c1, V.c2], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play] looks at all your Life cards and places them back in the order you choose', () => {
    const g = start();
    play(g, ID);
    expect(dec(g)!.kind).toBe('order');
    g.act({ type: 'order', first: g.find('p1', 'life', V.c2) });
    g.act({ type: 'order', first: g.find('p1', 'life', V.c3) });
    expect(zoneOf(g, 'p1', 'life')).toEqual([V.c2, V.c3, V.c1]);
    expect(dec(g)?.kind).toBe('main');
  });

  it('no Life card leaves the Life area and none is drawn', () => {
    const g = start();
    play(g, ID);
    g.act({ type: 'order', first: g.find('p1', 'life', V.c3) });
    g.act({ type: 'order', first: g.find('p1', 'life', V.c1) });
    expect(g.eventsOfType('CardMoved').filter((e) => e.from === 'life')).toHaveLength(0);
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('with no Life cards nothing is asked', () => {
    const g = game(
      { leader: CP_L, hand: [ID], life: [], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });

  it("[Trigger] with a {CP} Leader: place a Character with a cost of 5 or less at the bottom of its owner's deck", () => {
    const g = trig(ID, {}, [V.c5, V.c6]);
    g.act({ type: 'trigger', activate: true });
    expect(candidates(g)).toEqual([g.find('p2', 'characters', V.c5)]);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(zoneOf(g, 'p2', 'deck').at(-1)).toBe(V.c5);
  });

  it('[Trigger] "up to 1" may place nothing; without a {CP} Leader nothing happens', () => {
    const g = trig(ID, {}, [V.c5]);
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(zoneOf(g, 'p2', 'characters')).toContain(V.c5);
    const g2 = trig(ID, { leader: 'ST04-001' }, [V.c5]);
    g2.act({ type: 'trigger', activate: true });
    expectDecision(g2, 'main', 'p2');
  });
});
