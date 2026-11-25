/**
 * OP09-037 Lim (Character, Green, cost 3, 5000, no Counter, {ODYSSEY}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 "ODYSSEY" type card
 * other than [Lim] and add it to your hand. Then, place the rest at the bottom of your deck in any
 * order.
 * [End of Your Turn] If you have 3 or more rested Characters, set this Character as active."
 *
 * Rules: CR 8-4-4 ("up to"), CR 11-2-1 (reveal), CR 6-6-1-1 ([End of Your Turn]), a colon-less "If"
 * is an effect condition. The rested count includes Lim itself when he is rested.
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  at,
  atMain,
  deckTop,
  describeLook,
  L9,
  mine,
  need,
  offeredIds,
  playId,
  theirs,
  V9,
} from './kit-op09b.ts';

const LIM = 'OP09-037';
const USOPP_ODYSSEY = 'OP09-024';
const TONY_ODYSSEY = 'OP09-029';

describeLook({
  id: LIM,
  n: 5,
  main: 'p1',
  rest: 'bottom',
  start: (top) => {
    const g = mine(L9.neutral, { hand: [LIM], deck: top });
    playId(g, LIM);
    return g;
  },
  match: [V9.lucci, USOPP_ODYSSEY],
  multi: TONY_ODYSSEY,
  excluded: V9.limOther,
  miss: V9.c4,
});

const lim = (g: ReturnType<typeof mine>) => at(g, 'p1', 'characters', LIM);

describe('OP09-037 Lim: [On Play] look at 5 for an {ODYSSEY} card other than [Lim]', () => {
  it('another card named [Lim] is excluded even though it is {ODYSSEY}; a card of another name is offered', () => {
    const g = mine(L9.neutral, {
      hand: [LIM],
      deck: deckTop([V9.limOther, 'EB03-037', V9.lucci, V9.c4, V9.c5]),
    });
    playId(g, LIM);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.lucci]);
  });

  it('a card that is not {ODYSSEY} is not offered (Hajrudin, Kingdew)', () => {
    const g = mine(L9.neutral, {
      hand: [LIM],
      deck: deckTop([V9.c4, V9.c5, V9.lucci, V9.c6, V9.c7]),
    });
    playId(g, LIM);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([V9.lucci]);
  });
});

describe('OP09-037 Lim: [End of Your Turn] with 3+ rested Characters, set this Character as active', () => {
  it('Lim rested plus 2 other rested Characters (3 rested): he is set active at the end of my turn', () => {
    const g = mine(L9.neutral, {
      characters: [
        { card: LIM, rested: true },
        { card: V9.c4, rested: true },
        { card: V9.c5, rested: true },
      ],
    });
    act(g, { type: 'endTurn' });
    expect(g.card(lim(g)).rested).toBe(false);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('boundary: Lim rested plus 1 other rested Character (2 rested) stays rested', () => {
    const g = mine(L9.neutral, {
      characters: [{ card: LIM, rested: true }, { card: V9.c4, rested: true }, V9.c5],
    });
    act(g, { type: 'endTurn' });
    expect(g.card(lim(g)).rested).toBe(true);
  });

  it('boundary: Lim rested, one other rested and one active (2 rested): no change', () => {
    const g = mine(L9.neutral, {
      characters: [{ card: LIM, rested: true }, { card: V9.c4, rested: true }, V9.c5, V9.c6],
    });
    act(g, { type: 'endTurn' });
    expect(g.card(lim(g)).rested).toBe(true);
  });

  it('only Lim is set active: the other rested Characters stay rested', () => {
    const g = mine(L9.neutral, {
      characters: [
        { card: LIM, rested: true },
        { card: V9.c4, rested: true },
        { card: V9.c5, rested: true },
      ],
    });
    act(g, { type: 'endTurn' });
    expect(g.card(at(g, 'p1', 'characters', V9.c4)).rested).toBe(true);
    expect(g.card(at(g, 'p1', 'characters', V9.c5)).rested).toBe(true);
  });

  it("the opponent's rested Characters do not count", () => {
    const g = mine(
      L9.neutral,
      {
        characters: [
          { card: LIM, rested: true },
          { card: V9.c4, rested: true },
        ],
      },
      {
        characters: [
          { card: V9.c5, rested: true },
          { card: V9.c6, rested: true },
        ],
      },
    );
    act(g, { type: 'endTurn' });
    expect(g.card(lim(g)).rested).toBe(true);
  });

  it("must not fire at the end of the opponent's turn", () => {
    const g = theirs(L9.neutral, {
      characters: [
        { card: LIM, rested: true },
        { card: V9.c4, rested: true },
        { card: V9.c5, rested: true },
      ],
    });
    act(g, { type: 'endTurn' });
    expect(g.events.filter((e) => e.type === 'EffectActivated' && e.card === LIM)).toHaveLength(0);
  });
});
