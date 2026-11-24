/** OP17-108 Charlotte Brulee. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';
import { triggerHit } from './helpers-robin.ts';

const ID = 'OP17-108';

describe('OP17-108 Charlotte Brulee', () => {
  it('has [Blocker]', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[Trigger] rests up to 1 opposing Character with a cost of 6 or less', () => {
    const g = triggerHit(ID, {}, [V.c6, V.c5]);
    g.act({ type: 'trigger', activate: true });
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('a Character with a cost of 7 is not a legal target', () => {
    // p2 has the rested 7000 attacker and one more active cost-7 Character: neither qualifies.
    const g = triggerHit(ID, {}, [V.c7]);
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'characters', V.c7, 1)).rested).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = triggerHit(ID, {}, [V.c6]);
    g.act({ type: 'trigger', activate: true });
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
  });

  it('not activating the [Trigger] rests nothing and the card goes to the hand', () => {
    const g = triggerHit(ID, {}, [V.c6]);
    g.act({ type: 'trigger', activate: false });
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([ID]);
  });
});
