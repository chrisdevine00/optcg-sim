/**
 * OP08-110 Wyper (Character, Yellow, cost 4, 5000, Counter +2000, {Sky Island}/{Shandian Warrior}).
 *
 * Card text: "[On Play] Look at 5 cards from the top of your deck; reveal up to 1 [Upper Yard] and add it to
 * your hand. Then, place the rest at the bottom of your deck in any order and play up to 1 [Upper Yard]
 * from your hand."
 *
 * Rules: CR 8-4-4-1/-2 (up to / may find nothing), CR 2-1-2 ([Upper Yard] is the card name, OP05-117),
 * CR 2-7-4 (a Stage played by an effect goes to the Stage area; Upper Yard's own [On Play] then triggers).
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  BLUE,
  choices,
  chooseCards,
  chooseNone,
  checkLook,
  hand,
  kind,
  mine,
  playCard,
  settleNo,
  SC,
  YL,
} from './kit-a.ts';

const UY = SC.upperYard;

function played(top: string[], handExtra: string[] = [], beyond: string = BLUE) {
  const g = mine(YL.shandian, {
    hand: ['OP08-110', ...handExtra],
    deck: [...top, beyond, ...fill(BLUE, 12)],
  });
  playCard(g, 'OP08-110');
  return g;
}

const stage = (g: ReturnType<typeof played>) => g.zone('p1', 'stage').map((c) => c.card);

/** Answer decisions until the play-from-hand step (candidates in hand) is reached; none-choice for others. */
function toPlayStep(g: ReturnType<typeof played>) {
  for (let i = 0; i < 6; i++) {
    if (kind(g) === 'order') {
      g.act(g.legal().find((a) => a.type === 'order')!);
      continue;
    }
    if (kind(g) !== 'choose') return;
    const ids = choices(g);
    if (ids.length && ids.every((c) => g.card(c).zone === 'hand')) return;
    chooseNone(g);
  }
}

describe('OP08-110 Wyper: [On Play] look at 5 for [Upper Yard], add it, then play up to 1 [Upper Yard] from hand', () => {
  it('offers only [Upper Yard] among the top 5 (not other Sky Island cards, not the one in 6th place)', () => {
    const g = played([SC.genbo, UY, BLUE, SC.holly, SC.seto], [], UY);
    checkLook(g, { candidates: [UY], pick: [] });
  });

  it('add it, then play it from hand: it ends up in the Stage area, not in hand', () => {
    const g = played([SC.genbo, UY, BLUE, SC.holly, SC.seto]);
    chooseCards(g, [UY]);
    toPlayStep(g);
    chooseCards(g, [UY]);
    // Playing Upper Yard triggers its own [On Play] (look at 5): decline whatever it offers.
    settleNo(g, 'p1');
    expect(stage(g)).toEqual([UY]);
    expect(hand(g)).not.toContain(UY);
  });

  it('an [Upper Yard] already in hand is played even when none is found in the deck', () => {
    const g = played([SC.genbo, BLUE, BLUE, SC.holly, SC.seto], [UY]);
    toPlayStep(g);
    chooseCards(g, [UY]);
    settleNo(g, 'p1');
    expect(stage(g)).toEqual([UY]);
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1": the added [Upper Yard] may be left in hand', () => {
    const g = played([UY, BLUE, BLUE, BLUE, BLUE]);
    chooseCards(g, [UY]);
    toPlayStep(g);
    chooseNone(g);
    settleNo(g, 'p1');
    expect(stage(g)).toEqual([]);
    expect(hand(g)).toEqual([UY]);
  });

  it('with no [Upper Yard] in the top 5 or the hand nothing is added or played', () => {
    const g = played([BLUE, BLUE, BLUE, BLUE, BLUE]);
    checkLook(g, { candidates: [], pick: [] });
    expect(stage(g)).toEqual([]);
    expect(hand(g)).toEqual([]);
  });

  it('with two [Upper Yard] in hand only one is played, and other hand cards are untouched', () => {
    const g = played([UY, BLUE, BLUE, BLUE, BLUE], [UY, SC.bobbin]);
    chooseCards(g, [UY]);
    toPlayStep(g);
    chooseCards(g, [UY]);
    settleNo(g, 'p1');
    expect(stage(g)).toEqual([UY]);
    expect(hand(g).filter((c) => c === UY)).toHaveLength(1);
    expect(hand(g)).toContain(SC.bobbin);
  });
});
