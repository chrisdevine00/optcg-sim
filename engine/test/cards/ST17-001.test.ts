/** ST17-001 Crocodile. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, pick, play, times, V } from './helpers.ts';
import { cardsIn, mk, WARLORD6, WARLORD8 } from './helpers-prbst.ts';

const ID = 'ST17-001';

describe('ST17-001 Crocodile', () => {
  const start = (top: string, handExtra: string[] = [BLUE]) =>
    mk({ hand: [ID, ...handExtra], deck: [top, V.c1, V.c2, ...times(5, BLUE)] });

  it('[On Play]: reveals the top card; a "The Seven Warlords of the Sea" card: draw 2 and place 1 card from hand on top of the deck', () => {
    const g = start(WARLORD8);
    play(g, ID);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(WARLORD8);
    // Hand: BLUE, WARLORD8 (revealed, drawn first), V.c1: place one on top.
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    pick(g, [g.find('p1', 'hand', BLUE)]);
    expect(hand(g, 'p1')).toEqual([WARLORD8, V.c1]);
    expect(cardsIn(g, 'p1', 'deck')[0]).toBe(BLUE);
    expect(cardsIn(g, 'p1', 'deck')[1]).toBe(V.c2);
  });

  it('the placed card is mandatory ("place 1 card"): it may be a card just drawn', () => {
    const g = start(WARLORD6);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', WARLORD6)]);
    expect(cardsIn(g, 'p1', 'deck')[0]).toBe(WARLORD6);
    expect(hand(g, 'p1')).toEqual([BLUE, V.c1]);
  });

  it('must not fire: a card of another type is only revealed and stays on top', () => {
    const g = start(V.c3);
    play(g, ID);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(V.c3);
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(cardsIn(g, 'p1', 'deck')[0]).toBe(V.c3);
  });

  it('with an empty hand besides, the revealed Warlord and the second card are drawn and one is placed back', () => {
    const g = start(WARLORD8, []);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(hand(g, 'p1')).toEqual([WARLORD8]);
    expect(cardsIn(g, 'p1', 'deck')[0]).toBe(V.c1);
  });
});
