/** ST18-004 Zoro-Juurou. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, V } from './helpers.ts';
import { BN6, PSHC4, PSHC_EVENT, RSHC_5, mk, offered } from './helpers-st1821.ts';
import type { TestGame } from '../fixtures/index.ts';

const ID = 'ST18-004';

/** Deck top 5: purple {SHC} Character, purple {SHC} Event, red {SHC}, purple non-{SHC}, black {Navy}; then 3 fillers. */
const DECK = [PSHC4, PSHC_EVENT, RSHC_5, V.c1, BN6, V.c2, V.c3, V.c4];

const start = (): TestGame => mk({ hand: [ID], deck: DECK, costArea: { active: 4, rested: 0 } });
const bottom = (g: TestGame, n: number) =>
  g
    .zone('p1', 'deck')
    .slice(-n)
    .map((c) => c.card);

describe('ST18-004 Zoro-Juurou', () => {
  it('[On Play]: only purple {Straw Hat Crew} cards of the top 5 are takeable (Event included)', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(offered(g).sort()).toEqual(
      [g.find('p1', 'deck', PSHC4), g.find('p1', 'deck', PSHC_EVENT)].sort(),
    );
  });

  it('takes 1 into the hand (revealed) and puts the other 4 at the bottom in a chosen order', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'deck', PSHC4)]);
    expect(hand(g, 'p1')).toEqual([PSHC4]);
    expectDecision(g, 'order', 'p1');
    // Chosen one at a time: Bn6 first, then whatever the engine offers.
    g.act(g.legal().find((x) => x.type === 'order' && g.card(x.first).card === BN6)!);
    while (dec(g)?.kind === 'order') g.act(g.legal().find((x) => x.type === 'order')!);
    // The four unchosen cards go to the bottom, below the 3 untouched ones.
    expect(g.zone('p1', 'deck')).toHaveLength(7);
    expect(
      g
        .zone('p1', 'deck')
        .slice(0, 3)
        .map((c) => c.card),
    ).toEqual([V.c2, V.c3, V.c4]);
    expect(bottom(g, 4)[0]).toBe(BN6);
    expect(g.eventsOfType('CardRevealed').length).toBeGreaterThan(0);
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'order', 'p1');
  });

  it('a Character of the right type in the wrong color, or the right color of another type, is not offered', () => {
    const g = mk({
      hand: [ID],
      deck: [RSHC_5, V.c1, BN6, V.c2, V.c3, V.c4],
      costArea: { active: 4, rested: 0 },
    });
    play(g, ID);
    // Nothing matches: no pick is asked, the 5 cards just go to the bottom (an order is asked).
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('only the top 5 are looked at: a purple {SHC} card in 6th place stays', () => {
    const g = mk({
      hand: [ID],
      deck: [V.c1, V.c2, V.c3, BN6, RSHC_5, PSHC4],
      costArea: { active: 4, rested: 0 },
    });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    expect(hand(g, 'p1')).toEqual([]);
  });
});
