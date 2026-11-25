/** OP10-092 Perona. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  BB4,
  canActivate,
  canPick,
  dec,
  expectDecision,
  finishOrder,
  idsOf,
  mk,
  none,
  PERONA_V,
  pick,
  TB_A,
  TB_B,
  V,
} from './helpers-a10g3.ts';

const ID = 'OP10-092';
const start = (p1: object = {}) =>
  mk({
    characters: [ID, V.c4],
    trash: [TB_A, V.c1, TB_B],
    deck: [V.c2, V.c3],
    ...p1,
  });

/** Pay the cost: pick the cards if asked, then answer the bottom-of-deck order. */
function pay(g: ReturnType<typeof start>, ids: string[]): void {
  if (dec(g)?.kind === 'choose') pick(g, ids);
  finishOrder(g);
}

describe('OP10-092 Perona', () => {
  it('place 2 Thriller Bark Pirates cards from the trash at the deck bottom: another Character gets +2000 power', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pay(g, [g.find('p1', 'trash', TB_A), g.find('p1', 'trash', TB_B)]);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(false); // not itself
    pick(g, [g.find('p1', 'characters', V.c4)]);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(8000);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c1]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck.slice(0, 2)).toEqual([V.c2, V.c3]);
    expect([...deck.slice(2)].sort()).toEqual([TB_A, TB_B].sort());
  });

  it('with 3 eligible cards you choose which 2; the third stays in the trash', () => {
    const g = start({ trash: [TB_A, TB_B, PERONA_V] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'trash', PERONA_V))).toBe(true);
    pick(g, [g.find('p1', 'trash', TB_A), g.find('p1', 'trash', PERONA_V)]);
    finishOrder(g);
    none(g);
    expect(idsOf(g, 'p1', 'trash')).toEqual([TB_B]);
  });

  it('a Character named [Perona] is not a target (other than [Perona])', () => {
    const g = start({ characters: [ID, PERONA_V, V.c4] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pay(g, [g.find('p1', 'trash', TB_A), g.find('p1', 'trash', TB_B)]);
    expect(canPick(g, g.find('p1', 'characters', PERONA_V))).toBe(false);
    none(g);
  });

  it('"up to 1": may boost nothing, the cost is still paid', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pay(g, [g.find('p1', 'trash', TB_A), g.find('p1', 'trash', TB_B)]);
    none(g);
    expect(g.power(g.find('p1', 'characters', V.c4))).toBe(6000);
    expect(idsOf(g, 'p1', 'trash')).toEqual([V.c1]);
  });

  it('Once Per Turn', () => {
    const g = start({ trash: [TB_A, TB_B, PERONA_V, TB_A, TB_B] });
    activate(g, g.find('p1', 'characters', ID), 'activate');
    pay(g, [g.find('p1', 'trash', TB_A), g.find('p1', 'trash', TB_B)]);
    none(g);
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });

  it('must not be offered with only 1 Thriller Bark Pirates card in the trash', () => {
    const g = start({ trash: [TB_A, V.c1, BB4] });
    expect(canActivate(g, g.find('p1', 'characters', ID), 'activate')).toBe(false);
  });
});
