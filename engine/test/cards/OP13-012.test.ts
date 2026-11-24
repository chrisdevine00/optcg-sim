/** OP13-012 Nefeltari Vivi. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, none, pick, play } from './helpers.ts';
import { finishOrder } from './helpers-luffyace.ts';
import { ALABASTA1, ALABASTA2, mk, PLAIN5, SHC2 } from './helpers-op13g1.ts';

const ID = 'OP13-012';

describe('OP13-012 Nefeltari Vivi', () => {
  // Top 4: an Alabasta cost 2, an Alabasta+Straw Hat Crew cost 1, a cost 5 of neither type, a Straw
  // Hat Crew cost 2. Under them 6 filler cards.
  const start = () =>
    mk({
      hand: [ID],
      deck: [ALABASTA2, ALABASTA1, PLAIN5, SHC2, BLUE, BLUE, BLUE, BLUE, BLUE, BLUE],
    });

  it('[On Play]: looks at 4, adds up to 1 {Alabasta} or {Straw Hat Crew} card with cost 2 or more to the hand, the rest go to the bottom', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', ALABASTA2)]);
    finishOrder(g);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([ALABASTA2]);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(9);
    // The 5th card (not looked at) is now on top; the other 3 looked-at cards are at the bottom.
    expect(deck.slice(0, 6)).toEqual([BLUE, BLUE, BLUE, BLUE, BLUE, BLUE]);
    expect(deck.slice(6).sort()).toEqual([ALABASTA1, PLAIN5, SHC2].sort());
  });

  it('boundary: only cost 2 or more is offered (a cost 1 Alabasta/Straw Hat Crew card and a cost 5 card of neither type are not)', () => {
    const g = start();
    play(g, ID);
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered.sort()).toEqual(
      [g.find('p1', 'deck', ALABASTA2), g.find('p1', 'deck', SHC2)].sort(),
    );
  });

  it('a {Straw Hat Crew} card of cost 2 qualifies too', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'deck', SHC2)]);
    finishOrder(g);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([SHC2]);
  });

  it('"up to 1": may take nothing; then all 4 go to the bottom and the 5th card is on top', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    const deck = g.zone('p1', 'deck').map((c) => c.card);
    expect(deck).toHaveLength(10);
    expect(deck.slice(0, 6)).toEqual([BLUE, BLUE, BLUE, BLUE, BLUE, BLUE]);
    expect(deck.slice(6).sort()).toEqual([ALABASTA2, ALABASTA1, PLAIN5, SHC2].sort());
  });

  it('only the top 4 are looked at: a qualifying 5th card is not reachable', () => {
    const g = mk({
      hand: [ID],
      deck: [PLAIN5, ALABASTA1, BLUE, BLUE, ALABASTA2, BLUE, BLUE, BLUE, BLUE, BLUE],
    });
    play(g, ID);
    // Nothing among the top 4 qualifies: no card can be picked (the choice is empty).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });
});
