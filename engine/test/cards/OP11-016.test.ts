/** OP11-016 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { dec, don, pick, V } from './helpers.ts';
import { activate, canPick, mk, offeredAb } from './helpers-op11g1.ts';

const ID = 'OP11-016';
const rested = { active: 3, rested: 2 };

describe('OP11-016 Zoro', () => {
  it('[Activate: Main] [Once Per Turn]: gives 1 rested DON!! to a Character', () => {
    const g = mk({ characters: [ID, V.c1], costArea: rested });
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.card(g.find('p1', 'characters', V.c1)).don).toBe(1);
    expect(don(g, 'p1').rested).toBe(1);
    expect(don(g, 'p1').active).toBe(3);
    expect(don(g, 'p1').given).toBe(1);
  });

  it('may give it to the Leader, or to Zoro himself', () => {
    const g = mk({ characters: [ID], costArea: rested });
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
    const h = mk({ characters: [ID], costArea: rested });
    activate(h, h.find('p1', 'characters', ID), 'give-don');
    pick(h, [h.find('p1', 'characters', ID)]);
    expect(h.card(h.find('p1', 'characters', ID)).don).toBe(1);
  });

  it('gives only a rested DON!!: with all DON!! active nothing is given (the use is spent)', () => {
    const g = mk({ characters: [ID, V.c1], costArea: { active: 5, rested: 0 } });
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expect(dec(g)?.kind).toBe('main');
    expect(g.card(g.find('p1', 'characters', V.c1)).don).toBe(0);
    expect(don(g, 'p1').active).toBe(5);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(false);
  });

  it('is Once Per Turn', () => {
    const g = mk({ characters: [ID, V.c1], costArea: rested });
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(false);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'give-don')).toBe(true);
  });

  it("only your Leader and Characters can receive it, not the opponent's", () => {
    const g = mk({ characters: [ID], costArea: rested }, { characters: [V.c2] });
    activate(g, g.find('p1', 'characters', ID), 'give-don');
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    expect(canPick(g, g.leader('p2'))).toBe(false);
  });
});
