/** OP12-094 Monkey.D.Dragon. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, none, pick, play, trash } from './helpers.ts';
import {
  cardsIn,
  mk,
  offered,
  orderAll,
  PLAIN_BLUE,
  RA2,
  RA5,
  RA8,
  rep,
  V,
} from './helpers-op12g3.ts';

const ID = 'OP12-094';
/** Trash: four Revolutionary Army cards, a cost 3, a cost 6 and a cost 7 non-Army card. */
const TRASH = [RA2, RA5, RA8, RA2, V.c3, V.c6, V.c7];

const start = (trashCards: string[] = TRASH, leader?: string) =>
  mk({ hand: [ID], trash: trashCards, deck: rep(3, V.c1), ...(leader ? { leader } : {}) });

/** Pay the cost with these three Revolutionary Army cards. */
function payCost(g: ReturnType<typeof start>, a = RA2, b = RA5, c = RA8) {
  play(g, ID);
  accept(g);
  // With exactly 3 candidates the cost has nothing to choose.
  if (dec(g)?.kind === 'choose')
    pick(g, [g.find('p1', 'trash', a), g.find('p1', 'trash', b), g.find('p1', 'trash', c)]);
  orderAll(g);
}

describe('OP12-094 Monkey.D.Dragon', () => {
  it('[On Play] place 3 Revolutionary Army cards at the bottom of the deck: plays up to 1 Character with cost 6 or less from the trash', () => {
    const g = start();
    payCost(g);
    expect(cardsIn(g, 'p1', 'deck').slice(3).sort()).toEqual([RA2, RA5, RA8].sort());
    expectDecision(g, 'choose', 'p1');
    // Cost 6 is the boundary: costs 2, 3 and 6 are offered, cost 7 is not; the paid cards are gone.
    expect(offered(g).sort()).toEqual(
      [g.find('p1', 'trash', RA2), g.find('p1', 'trash', V.c3), g.find('p1', 'trash', V.c6)].sort(),
    );
    pick(g, [g.find('p1', 'trash', V.c6)]);
    expect(cardsIn(g, 'p1', 'characters').sort()).toEqual([ID, V.c6].sort());
    expect(trash(g, 'p1').sort()).toEqual([RA2, V.c3, V.c7].sort());
  });

  it('the cost cards are chosen among Revolutionary Army cards only', () => {
    const g = start();
    play(g, ID);
    accept(g);
    const o = offered(g);
    expect(o.length).toBeGreaterThan(0);
    for (const c of [V.c3, V.c6, V.c7]) expect(o).not.toContain(g.find('p1', 'trash', c));
  });

  it('"up to 1": may play nothing; the cost stays paid', () => {
    const g = start();
    payCost(g);
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(trash(g, 'p1')).toHaveLength(4);
  });

  it('must not play with a Leader that is not "Revolutionary Army": the cost is paid, nothing is played', () => {
    const g = start(TRASH, PLAIN_BLUE);
    payCost(g);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(cardsIn(g, 'p1', 'deck')).toHaveLength(6);
  });

  it('declining the optional cost does nothing; with only 2 Revolutionary Army cards the cost is not offered', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(trash(g, 'p1')).toHaveLength(7);
    const h = start([RA2, RA5, V.c3, V.c4]);
    play(h, ID);
    expect(dec(h)?.kind).toBe('main');
    expect(trash(h, 'p1')).toHaveLength(4);
  });
});
