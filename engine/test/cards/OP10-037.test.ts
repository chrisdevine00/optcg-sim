/** OP10-037 Lim. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, pick, V } from './helpers.ts';
import { plantOpponentEffect } from './helpers-rgl-penel.ts';
import { applyOp } from '../../src/testing.ts';
import { canPick } from './helpers-w3s.ts';
import { mk, OD4, restedCard, runMine } from './helpers-a10g2.ts';

const ID = 'OP10-037';
const koOne = { ko: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } };
const noDon = { active: 0, rested: 0 };
const chars = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

/** p2's turn; p2 K.O.s Lim (or `target`). */
const byOpponent = (target = ID) => {
  const g = mk(
    { characters: [ID, OD4, V.c1], costArea: noDon },
    {},
    { turn: 4, activePlayer: 'p2' },
  );
  plantOpponentEffect(g, koOne);
  pick(g, [g.find('p1', 'characters', target)]);
  return g;
};

describe('OP10-037 Lim', () => {
  it("instead of being removed by your opponent's effect, you may rest 1 of your {ODYSSEY} Characters", () => {
    const g = byOpponent();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [g.find('p1', 'characters', OD4)]);
    expect(chars(g)).toContain(ID);
    expect(g.card(g.find('p1', 'characters', OD4)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
  });

  it('only {ODYSSEY} Characters can be rested (not other Characters or the Leader); Lim may rest herself', () => {
    const g = byOpponent();
    accept(g);
    expect(canPick(g, g.find('p1', 'characters', OD4))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(chars(g)).toContain(ID);
  });

  it('declining lets the removal happen', () => {
    const g = byOpponent();
    decline(g);
    expect(chars(g)).not.toContain(ID);
    expect(g.card(g.find('p1', 'characters', OD4)).rested).toBe(false);
  });

  it('[Once Per Turn]: a second removal the same turn is not replaced', () => {
    const g = mk({ characters: [ID, OD4], costArea: noDon }, {}, { turn: 4, activePlayer: 'p2' });
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', ID)]);
    accept(g);
    pick(g, [g.find('p1', 'characters', OD4)]);
    g.act({ type: 'activate', card: g.leader('p2'), ability: 'planted' });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).not.toContain(ID);
  });

  it('is not offered with no active {ODYSSEY} Character to rest', () => {
    const g = mk(
      { characters: [restedCard(ID), restedCard(OD4)], costArea: noDon },
      {},
      { turn: 4, activePlayer: 'p2' },
    );
    plantOpponentEffect(g, koOne);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).not.toContain(ID);
  });

  it('must not apply to your own effect or to a K.O. by your own effect', () => {
    const g = mk({ characters: [ID, OD4] });
    runMine(g, {
      ko: { from: 'characters', owner: 'you', filter: { name: 'Lim' }, pick: { upTo: 1 } },
    });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).not.toContain(ID);

    const h = mk({ characters: [ID, OD4] });
    h.state = applyOp(h.state, { op: 'ko', card: h.find('p1', 'characters', ID), by: 'p1' }).state;
    expect(chars(h)).not.toContain(ID);
  });

  it('[End of Your Turn]: sets up to 1 of your {ODYSSEY} Characters as active', () => {
    const g = mk({ characters: [ID, restedCard(OD4), restedCard(V.c1)] });
    g.act({ type: 'endTurn' });
    if (dec(g)?.kind === 'choose') pick(g, [g.find('p1', 'characters', OD4)]);
    expect(g.card(g.find('p1', 'characters', OD4)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
  });

  it('[End of Your Turn] must not set a rested non-{ODYSSEY} Character', () => {
    const g = mk({ characters: [ID, restedCard(V.c1)] });
    g.act({ type: 'endTurn' });
    expect(g.card(g.find('p1', 'characters', V.c1)).rested).toBe(true);
  });
});
