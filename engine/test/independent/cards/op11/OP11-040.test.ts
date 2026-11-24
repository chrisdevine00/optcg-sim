/**
 * OP11-040 Monkey.D.Luffy (Blue/Purple Leader, 6000, 3 Life, {Straw Hat Crew}).
 *
 * Card text: "This effect can be activated at the start of your turn. If you have 8 or more DON!! cards
 * on your field, look at 5 cards from the top of your deck; reveal up to 1 {Straw Hat Crew} type card
 * and add it to your hand. Then, place the rest at the top or bottom of the deck in any order."
 *
 * Rules: "start of your turn" is before the Refresh/Draw/DON!! phases of my turn, so the DON!! count
 * is the one I end the previous turn with (active, rested and given DON!! all count). The effect is
 * mine only at the start of MY turn. Any category of card qualifies. The rest goes back all on top
 * or all on the bottom in an order I choose. The draw of the Draw Phase follows afterwards (turn 5
 * is not my first turn).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  BLUE,
  C11,
  choices,
  deck,
  E11,
  fill,
  hand,
  kind,
  L11,
  need,
  none,
  offeredIds,
  pickInst,
  side,
  theirTurn,
  trash,
  RED,
  decision,
} from './kit-op11b.ts';

const LUFFY = L11.luffy40;
/** Cards below the five looked at, all distinct from the cards looked at. */
const BELOW = [C11.c6, C11.c7, ...fill(C11.c10, 8)];
const TOP5 = [C11.shc3, C11.c1, C11.shc5, C11.c2, C11.c3];

/** p2's turn ends; p1 (Luffy) starts turn 5 with `active`/`rested` DON!! on the field. */
function turnStart(
  o: {
    active?: number;
    rested?: number;
    given?: number;
    top?: string[];
  } = {},
) {
  const g = theirTurn(
    side(LUFFY, BLUE, {
      leader: { card: LUFFY, don: o.given ?? 0 },
      costArea: { active: o.active ?? 8, rested: o.rested ?? 0 },
      deck: [...(o.top ?? TOP5), ...BELOW],
    }),
    side(L11.mono, RED, {}),
  );
  act(g, { type: 'endTurn' });
  return g;
}

function placeRest(g: ReturnType<typeof turnStart>, where: 'top' | 'bottom', order: string[] = []) {
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: { option: where } });
  for (let i = 0; i < order.length - 1; i++) {
    need(g, 'order', 'p1');
    const a = g.legal().find((x) => x.type === 'order' && g.card(x.first).card === order[i]);
    if (!a) throw new Error(`order for ${order[i]} not offered`);
    g.act(a);
  }
  while (kind(g) === 'order') g.act(g.legal().find((x) => x.type === 'order')!);
}

describe('OP11-040 Monkey.D.Luffy: at the start of my turn, with 8+ DON!!, look at 5 and add up to 1 {Straw Hat Crew} card', () => {
  it('with 8 DON!! it looks at 5 and offers exactly the {Straw Hat Crew} cards (any category)', () => {
    const g = turnStart({ top: [C11.shc3, E11.cobra59, C11.c1, C11.fire3, C11.shc5] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C11.shc3, E11.cobra59, C11.shc5].sort());
  });

  it('the pick goes to the hand, then the rest is placed at the bottom: the next draw is the card below the five', () => {
    const g = turnStart();
    pickInst(g, [g.zone('p1', 'deck').find((c) => c.card === C11.shc5)!.instance]);
    placeRest(g, 'bottom', [C11.shc3, C11.c1, C11.c2, C11.c3]);
    expect(kind(g)).toBe('main');
    expect(g.events.some((e) => e.type === 'CardRevealed' && e.card === C11.shc5)).toBe(true);
    // hand: the picked card and the Draw Phase card (the 6th card of the old deck)
    expect(hand(g)).toEqual([C11.shc5, C11.c6].sort());
    expect(deck(g).slice(-4)).toEqual([C11.shc3, C11.c1, C11.c2, C11.c3]);
    expect(deck(g)).toHaveLength(15 - 1 - 1);
  });

  it('"top" with a chosen order: the rest sits on top in that order and the Draw Phase takes the first', () => {
    const g = turnStart();
    pickInst(g, [g.zone('p1', 'deck').find((c) => c.card === C11.shc5)!.instance]);
    placeRest(g, 'top', [C11.c3, C11.c2, C11.c1, C11.shc3]);
    expect(hand(g)).toEqual([C11.shc5, C11.c3].sort());
    expect(deck(g).slice(0, 3)).toEqual([C11.c2, C11.c1, C11.shc3]);
    expect(deck(g)[3]).toBe(C11.c6);
  });

  it('"up to 1": may add nothing; all 5 are placed (here on top, so the Draw Phase draws one of them)', () => {
    const g = turnStart();
    need(g, 'choose', 'p1');
    none(g);
    placeRest(g, 'top', TOP5);
    expect(hand(g)).toEqual([TOP5[0]]);
    expect(deck(g)).toHaveLength(14);
  });

  it('adds at most 1 card even when two qualify', () => {
    const g = turnStart();
    need(g, 'choose', 'p1');
    pickInst(g, [g.zone('p1', 'deck').find((c) => c.card === C11.shc3)!.instance]);
    placeRest(g, 'bottom');
    const shc = hand(g).filter((c) => c === C11.shc3 || c === C11.shc5);
    expect(shc).toHaveLength(1);
  });

  it('only the top 5 are looked at: a {Straw Hat Crew} card in 6th place is not offered', () => {
    const g = turnStart({ top: [C11.c1, C11.c1, C11.c1, C11.c1, C11.c1, C11.shc3] });
    need(g, 'choose', 'p1');
    expect(choices(g)).toEqual([]);
    none(g);
    placeRest(g, 'bottom');
    // the 6th card was not looked at: it is simply the Draw Phase card now
    expect(hand(g)).toEqual([C11.shc3]);
    expect(kind(g)).toBe('main');
  });

  it('with 7 DON!! on the field at the start of the turn nothing happens (the 2 DON!! of the DON!! Phase come later)', () => {
    const g = turnStart({ active: 7 });
    expect(kind(g)).toBe('main');
    expect(g.events.some((e) => e.type === 'CardsLooked')).toBe(false);
    expect(hand(g)).toEqual([C11.shc3]);
  });

  it('all kinds of DON!! on the field count: 4 active + 4 rested', () => {
    const g = turnStart({ active: 4, rested: 4 });
    need(g, 'choose', 'p1');
  });

  it('DON!! given to the Leader counts too: 5 active + 3 given', () => {
    const g = turnStart({ active: 5, given: 3 });
    need(g, 'choose', 'p1');
  });

  it('it does not fire at the start of the opponent turn', () => {
    const g = theirTurn(
      side(LUFFY, BLUE, { costArea: { active: 8, rested: 0 }, deck: [...TOP5, ...BELOW] }),
      side(L11.mono, RED, {}),
    );
    // p2's turn: p1 has nothing pending; p1 has not drawn or looked
    expect(decision(g)?.player).toBe('p2');
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });
});
