/** EB02-025 Donquixote Rosinante. */
import { describe, expect, it } from 'vitest';
import {
  activate,
  C1,
  C2,
  C3,
  C4,
  canPick,
  cardsOf,
  dec,
  don,
  EVENT,
  expectDecision,
  finishOrder,
  mk,
  none,
  offeredAb,
  pick,
  ROSI_LEADER,
  V,
} from './helpers-aeb2g1.ts';

const ID = 'EB02-025';
const A = 'play';
const EVENT2 = 'ST02-017'; // an Event with cost 2
const DECK = [C3, EVENT2, C2, C1, C4, V.c5];
const start = (leader = ROSI_LEADER, deck = DECK) =>
  mk({ leader, characters: [ID], deck, costArea: { active: 3, rested: 0 } });

describe('EB02-025 Donquixote Rosinante', () => {
  it('with a [Donquixote Rosinante] Leader: rests 1 DON!! and itself, looks at 5, plays a Character with cost 2 or less rested, the rest go to the bottom', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), A);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    // Offered: the two Characters with cost 2 or less; not cost 3, not the cost 2 Event, not the 6th card.
    expect(canPick(g, g.find('p1', 'deck', C2))).toBe(true); // cost 2: boundary
    expect(canPick(g, g.find('p1', 'deck', C1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', C3))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', EVENT2))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', C4))).toBe(false);
    pick(g, [g.find('p1', 'deck', C2)]);
    finishOrder(g);
    const played = g.find('p1', 'characters', C2);
    expect(g.card(played).rested).toBe(true);
    // The 4 other looked-at cards are at the bottom; the 6th card is on top.
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck).toHaveLength(5);
    expect(deck[0]).toBe(V.c5);
    expect(deck.slice(1).sort()).toEqual([C3, EVENT2, C1, C4].sort());
    expectDecision(g, 'main', 'p1');
  });

  it('with any other Leader the cost is paid and nothing else happens (an effect condition)', () => {
    const g = start('ST01-001');
    activate(g, g.find('p1', 'characters', ID), A);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 1 });
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p1', 'deck')).toEqual(DECK);
  });

  it('"up to 1": may play nothing; all 5 go to the bottom', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), A);
    none(g);
    finishOrder(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck[0]).toBe(V.c5);
    expect(deck).toHaveLength(DECK.length);
  });

  it('with no eligible card in the 5 the look is still done and all go to the bottom', () => {
    const g = start(ROSI_LEADER, [C3, EVENT2, C4, EVENT, V.c6, V.c5]);
    activate(g, g.find('p1', 'characters', ID), A);
    expect(dec(g)?.kind).toBe('choose');
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    g.act({ type: 'done' });
    finishOrder(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('cannot be activated when rested or with no active DON!!', () => {
    const a = mk({
      leader: ROSI_LEADER,
      characters: [{ card: ID, rested: true }],
      costArea: { active: 3, rested: 0 },
    });
    expect(offeredAb(a, a.find('p1', 'characters', ID), A)).toBe(false);
    const b = mk({ leader: ROSI_LEADER, characters: [ID], costArea: { active: 0, rested: 3 } });
    expect(offeredAb(b, b.find('p1', 'characters', ID), A)).toBe(false);
  });
});
