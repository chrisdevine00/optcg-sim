/** ST18-005 Luffy-Tarou. */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import { accept, decline, expectDecision, none, payDon, pick, play, V } from './helpers.ts';
import { PSHC4, PSHC5, PSHC6, PSHC_EVENT, RSHC_5, mk, offered } from './helpers-st1821.ts';

const ID = 'ST18-005';

/** Luffy-Tarou (cost 7) with 10 DON!!: 3 stay active, then DON!! -1 returns one. */
const start = (hand: string[] = [ID, PSHC4, PSHC5, PSHC6, PSHC_EVENT, RSHC_5, V.c4]) =>
  mk({ hand });

describe('ST18-005 Luffy-Tarou', () => {
  it('[On Play] DON!! -1: plays a purple {SHC} Character of cost 5 or less from hand (boundary 5)', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    expectDecision(g, 'choose', 'p1');
    // Cost 4 and cost 5 qualify; cost 6 (purple), the Event, the red {SHC} and the non-{SHC} do not.
    expect(offered(g).sort()).toEqual(
      [g.find('p1', 'hand', PSHC4), g.find('p1', 'hand', PSHC5)].sort(),
    );
    pick(g, [g.find('p1', 'hand', PSHC5)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, PSHC5]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).not.toContain(PSHC5);
  });

  it('the cost is DON!! -1: one DON!! goes back to the DON!! deck', () => {
    const g = start();
    const before = queries.don(g.state, 'p1');
    play(g, ID);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', PSHC4)]);
    const after = queries.don(g.state, 'p1');
    expect(after.deck).toBe(before.deck + 1);
  });

  it('declining the DON!! -1 plays nothing and returns nothing', () => {
    const g = start();
    const before = queries.don(g.state, 'p1');
    play(g, ID);
    decline(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(queries.don(g.state, 'p1').deck).toBe(before.deck);
  });

  it('"up to 1": may play nothing after paying the cost', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    none(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
  });

  it('the Character comes in active (not rested), and Luffy-Tarou stays', () => {
    const g = start();
    play(g, ID);
    accept(g);
    payDon(g);
    pick(g, [g.find('p1', 'hand', PSHC4)]);
    expect(g.card(g.find('p1', 'characters', PSHC4)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
  });
});
