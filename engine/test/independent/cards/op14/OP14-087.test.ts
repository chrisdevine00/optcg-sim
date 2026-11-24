/**
 * OP14-087 Miss.Valentine(Mikita) (Character, Black, cost 1, 2000, Counter +1000, {Baroque Works}).
 *
 * Card text: "[On Play] If your Leader's type includes "Baroque Works", look at 4 cards from the top of
 * your deck; reveal up to 1 card with a type including "Baroque Works" other than
 * [Miss.Valentine(Mikita)] and add it to your hand. Then, trash the rest."
 *
 * Rules: CR 8-4-4 ("look at", "up to"), CR 11-2-1 (reveal), RD 122 (a failed "If" ends the effect).
 * "type including" is a substring match: {Former Baroque Works} qualifies. "other than [X]" is by
 * name: [Miss.Valentine] (P-147) is a different card from [Miss.Valentine(Mikita)].
 */
import { describe, expect, it } from 'vitest';
import { queries } from '@optcg/engine';
import {
  atMain,
  BLUE,
  BW,
  deck,
  deckTop,
  describeLook,
  hand,
  kind,
  LD14,
  mine,
  offeredIds,
  pickCards,
  playId,
  SC14,
  trash,
} from './kit-op14d.ts';

const ID = 'OP14-087';

function played(leader: string, top: string[]) {
  const g = mine(LD14.neutral, { hand: [ID], deck: top });
  void leader;
  return g;
}
void played;

function start(top: string[], leader: string = LD14.bw) {
  const g = mine(leader, { hand: [ID], deck: top });
  playId(g, ID);
  return g;
}

describeLook({
  id: ID,
  n: 4,
  main: 'p1',
  rest: 'trash',
  start: (top) => start(top),
  match: [BW.mr9, BW.croc6],
  multi: BW.daz,
  excluded: BW.mikita,
  similar: BW.valentine,
  miss: SC14.c2,
});

describe('OP14-087 Miss.Valentine(Mikita): the Leader condition and the rest of the deck', () => {
  it('a Leader whose type does not include "Baroque Works": nothing is looked at, the deck is untouched', () => {
    const g = start(deckTop([BW.mr9, BW.croc6, SC14.c2, SC14.c4]), LD14.luffy);
    expect(atMain(g)).toBe(true);
    expect(deck(g).slice(0, 4)).toEqual([BW.mr9, BW.croc6, SC14.c2, SC14.c4]);
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([]);
  });

  it('with a {Baroque Works} Leader, Mikita enters play for 1 DON!! whatever is chosen', () => {
    const g = start(deckTop([BW.mr9, SC14.c2, SC14.c2, SC14.c2]));
    pickCards(g, [BW.mr9]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(hand(g)).toEqual([BW.mr9]);
  });

  it('a card that is not Baroque Works is never added, even if it is the only card looked at', () => {
    const g = start(deckTop([SC14.c2, SC14.c4, SC14.c5, SC14.c6]));
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      g.act({ type: 'done' });
    }
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SC14.c2, SC14.c4, SC14.c5, SC14.c6].sort());
  });

  it('trashing the last cards of the deck is a defeat at once (CR 1-2-1-1-2, 9-2-1-2): a deck of exactly 4 cards', () => {
    const g = start([BW.mr9, SC14.c2, SC14.c2, SC14.c2]);
    pickCards(g, [BW.mr9]);
    expect(deck(g)).toEqual([]);
    expect(queries.result(g.state)).toMatchObject({ winner: 'p2', reason: 'deck out' });
  });

  it('the cards are trashed, not returned: the looked-at cards beyond the pick are all in the trash', () => {
    const g = start(deckTop([BW.mr9, BW.croc6, SC14.c2, SC14.c4]));
    pickCards(g, [BW.croc6]);
    expect(trash(g)).toEqual([BW.mr9, SC14.c2, SC14.c4].sort());
    expect(BLUE).toBeTruthy();
  });
});
