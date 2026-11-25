/** OP11-040 Monkey.D.Luffy (Leader). */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, expectDecision, hand, none, option, pick, times, V } from './helpers.ts';
import { acceptUse, declineUse } from './helpers-w57.ts';
import { canPick, cardsOf, finishOrder, mk, SHC1, SHC4 } from './helpers-op11g2.ts';

const ID = 'OP11-040';
// Top 5: a {Straw Hat Crew}, a plain card, a {Straw Hat Crew}, two plain; the 6th is a {Straw Hat Crew}.
const top5 = [SHC1, V.c2, SHC4, V.c3, V.c4];
const deck = [...top5, SHC1, ...times(6, BLUE)];

/** p2 ends its turn, so p1's turn starts; p1's DON!! area holds `rested` rested and `active` active DON!!. */
const startOfTurn = (don: { active: number; rested: number }, d = deck) => {
  const g = mk({ leader: ID, deck: d, costArea: don }, {}, { turn: 2, activePlayer: 'p2' });
  g.act({ type: 'endTurn' });
  acceptUse(g, ID); // "This effect can be activated at the start of your turn" is optional (W57-R5)
  return g;
};

describe('OP11-040 Monkey.D.Luffy (Leader)', () => {
  it('start of your turn with 8 DON!!: looks at 5, takes a {Straw Hat Crew} card (a plain card is not offered), the rest to the top or bottom', () => {
    const g = startOfTurn({ active: 0, rested: 8 });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', SHC1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SHC4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c2))).toBe(false);
    pick(g, [g.find('p1', 'deck', SHC4)]);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.options?.map((o) => o.id)).toEqual(['top', 'bottom']);
    option(g, 'bottom');
    finishOrder(g);
    // The card taken is in hand (with the turn's draw, which comes after).
    expect(hand(g, 'p1')).toContain(SHC4);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(SHC4);
    const d2 = cardsOf(g, 'p1', 'deck');
    expect(d2.slice(-4).sort()).toEqual([SHC1, V.c2, V.c3, V.c4].sort());
  });

  it('the 4 looked-at cards can all go back on top', () => {
    const g = startOfTurn({ active: 0, rested: 8 });
    pick(g, [g.find('p1', 'deck', SHC1)]);
    option(g, 'top');
    finishOrder(g);
    const d2 = cardsOf(g, 'p1', 'deck');
    expect(d2).toHaveLength(deck.length - 1 - 1); // one taken, one drawn in the Draw Phase
    expect(d2.slice(-1)[0]).toBe(BLUE);
  });

  it('boundary: 7 DON!! is not enough, no look happens (the Draw Phase DON!! come after the start of turn)', () => {
    const g = startOfTurn({ active: 0, rested: 7 });
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toHaveLength(1); // only the Draw Phase card
  });

  it('DON!! given to a Character count (cost area plus given): 7 in the cost area and 1 given makes 8', () => {
    const g = mk(
      {
        leader: ID,
        deck,
        characters: [{ card: V.c1, don: 1 }],
        costArea: { active: 0, rested: 7 },
      },
      {},
      { turn: 2, activePlayer: 'p2' },
    );
    g.act({ type: 'endTurn' });
    acceptUse(g, ID);
    expectDecision(g, 'choose', 'p1');
  });

  it('"up to 1": may take nothing; the 5 cards go to the top or bottom; the 6th card is not looked at', () => {
    const g = startOfTurn({ active: 0, rested: 8 });
    none(g);
    option(g, 'bottom');
    finishOrder(g);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(deck.length - 1);
    // The 6th card (a {Straw Hat Crew}) was on top after the look and is the card drawn.
    expect(hand(g, 'p1')).toEqual([SHC1]);
  });

  it('W57-R5: "can be activated" is optional: declining looks at nothing, and the turn goes on', () => {
    const g = mk(
      { leader: ID, deck, costArea: { active: 0, rested: 8 } },
      {},
      { turn: 2, activePlayer: 'p2' },
    );
    g.act({ type: 'endTurn' });
    declineUse(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(hand(g, 'p1')).toEqual([SHC1]); // only the Draw Phase card
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(deck.length - 1);
  });

  it('only at the start of YOUR turn: p1 ending its own turn with 8 DON!! does not look', () => {
    const g = mk({ leader: ID, deck, costArea: { active: 8, rested: 0 } });
    g.act({ type: 'endTurn' });
    expect(g.zone('p1', 'deck')).toHaveLength(deck.length);
    expect(dec(g)?.player).toBe('p2');
  });
});
