/** OP13-033 Franky. */
import { describe, expect, it } from 'vitest';
import { don, none, pick, play } from './helpers.ts';
import { canPick, expectDecision, koBy, mk, V } from './helpers-op13g2.ts';

const ID = 'OP13-033';

const start = (p2: Parameters<typeof mk>[1] = {}) =>
  mk(
    { characters: [ID, V.c2] },
    { characters: [V.c1, V.c3], costArea: { active: 2, rested: 0 }, ...p2 },
  );
const ko = (g: ReturnType<typeof start>) => koBy(g, 'p1', ID, 'p2');

describe('OP13-033 Franky', () => {
  it("[On K.O.]: rests up to 2 of the opponent's Characters", () => {
    const g = start();
    ko(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(true);
  });

  it("may rest any of the opponent's cards: Leader and DON!! cards are candidates, your own cards are not", () => {
    const g = start();
    ko(g);
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    pick(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).rested).toBe(true);
    const h = start();
    ko(h);
    h.act({ type: 'pick', choice: { from: 'costActive' } });
    h.act({ type: 'done' });
    expect(don(h, 'p2').rested).toBe(1);
  });

  it('"up to 2": at most 2 can be rested; none is allowed', () => {
    const g = start();
    ko(g);
    pick(g, [g.find('p2', 'characters', V.c1), g.leader('p2')]);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
    const h = start();
    ko(h);
    none(h);
    expect(h.card(h.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('must not fire when played (it has no [On Play])', () => {
    const g = mk({ hand: [ID] }, { characters: [V.c1] });
    play(g, ID);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
    expectDecision(g, 'main', 'p1');
  });
});
