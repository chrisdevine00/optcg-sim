/** OP13-120 Sabo. */
import { describe, expect, it } from 'vitest';
import { dec, don, none, pick, PLAIN_PURPLE, V } from './helpers.ts';
import { activate } from './helpers-w3s.ts';
import { canActivate, canBlockWith, canPick, mine, theirs } from './helpers-op13g4.ts';
import { queries } from '@optcg/engine';

const ID = 'OP13-120';

describe('OP13-120 Sabo', () => {
  const run = (active: number, rested: number) =>
    mine({ leader: PLAIN_PURPLE, characters: [ID, V.c3] }, {}, active, rested);

  it('[Activate: Main] a Character gains +2 cost; then 1 rested DON!! is given to the Leader', () => {
    const g = run(2, 2);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expect(canPick(g, g.leader('p1'))).toBe(false);
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(g.card(g.find('p1', 'characters', V.c3)).cost).toBe(5);
    pick(g, [g.leader('p1')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ rested: 1, given: 1 });
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('Sabo himself is a legal target', () => {
    const g = run(2, 1);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(8);
    pick(g, [g.leader('p1')]);
  });

  it("the cost bonus lasts through the opponent's next turn and then ends", () => {
    const g = run(2, 1);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pick(g, [g.find('p1', 'characters', V.c3)]);
    pick(g, [g.leader('p1')]);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', V.c3)).cost).toBe(5);
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', V.c3)).cost).toBe(3);
  });

  it('"up to 1": choosing no Character still gives the DON!!; with no rested DON!! the cost bonus still applies', () => {
    const g = run(2, 2);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    pick(g, [g.leader('p1')]);
    expect(queries.don(g.state, 'p1')).toMatchObject({ given: 1 });
    const h = run(3, 0);
    activate(h, h.find('p1', 'characters', ID), 'activate');
    pick(h, [h.find('p1', 'characters', V.c3)]);
    if (dec(h)?.kind === 'choose') none(h);
    expect(h.card(h.find('p1', 'characters', V.c3)).cost).toBe(5);
    expect(don(h, 'p1').given).toBe(0);
  });

  it('Once Per Turn, and printed [Blocker]', () => {
    const g = run(2, 2);
    activate(g, g.find('p1', 'characters', ID), 'activate');
    none(g);
    pick(g, [g.leader('p1')]);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
    const b = theirs({ leader: PLAIN_PURPLE, characters: [ID] }, { characters: [V.c7] });
    b.act({ type: 'attack', attacker: b.find('p2', 'characters', V.c7), target: b.leader('p1') });
    expect(canBlockWith(b, b.find('p1', 'characters', ID))).toBe(true);
  });
});
