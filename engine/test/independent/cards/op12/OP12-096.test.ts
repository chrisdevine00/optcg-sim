/**
 * OP12-096 Ursa Shock (Event, Black, cost 4, {Revolutionary Army}/{The Seven Warlords of the Sea}).
 *
 * Card text: "[Main] K.O. up to 1 of your opponent's Characters with a cost of 4 or less. If you have a
 * Character with a cost of 8 or more, you may select your opponent's Character with a cost of 6 or less
 * instead. [Trigger] Draw 1 card and trash 1 card from the top of your deck."
 *
 * Rules: "cost" is the current cost (Morley under an RA Leader reads 8), CR 4-8-1 ("up to" allows 0),
 * "you have a Character" is my own field (rested Characters count), CR 10-1-5 ([Trigger]). OPEN: the
 * "may ... instead" wording (M6b-Q37, if/else) is only tested for what both readings share: with a
 * cost-8 Character, a cost-6 target is selectable; without one it is not.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  atMain,
  chars,
  deck,
  declineTrigger,
  hand,
  hitLeader,
  kind,
  LDR,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SCN,
  theirs,
  topDeck,
  trash,
} from './kit-op12c.ts';

const EVENT = 'OP12-096';

function play(
  mineChars: (string | { card: string; rested: boolean })[],
  oppChars: string[],
  leader: string = LDR.luffy,
) {
  const g = mine(
    leader,
    { hand: [EVENT], characters: mineChars as never },
    { characters: oppChars },
  );
  playRaw(g, EVENT);
  return g;
}

describe('OP12-096 Ursa Shock: [Main] K.O. a Character with cost <= 4 (or <= 6 with my cost-8 Character)', () => {
  it('base mode: opposing Characters with cost 4 or less are offered (4 in, 5 out)', () => {
    const g = play([], [SCN.c3, SCN.c4, SCN.c5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c4].sort());
  });

  it('the chosen Character is K.O.d (trashed), no other is, and the Event is trashed', () => {
    const g = play([], [SCN.c3, SCN.c4]);
    pickCards(g, [SCN.c4]);
    expect(chars(g, 'p2')).toEqual([SCN.c3]);
    expect(trash(g, 'p2')).toEqual([SCN.c4]);
    expect(trash(g)).toEqual([EVENT]);
    expect(atMain(g)).toBe(true);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = play([], [SCN.c3]);
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g, 'p2')).toEqual([SCN.c3]);
  });

  it('with my Character of cost 8 the range grows to cost 6 or less (6 in, 7 out)', () => {
    const g = play([SCN.c8], [SCN.c3, SCN.c5, SCN.c6, SCN.c7]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SCN.c3, SCN.c5, SCN.c6].sort());
    pickCards(g, [SCN.c6]);
    expect(trash(g, 'p2')).toEqual([SCN.c6]);
  });

  it('boundary: my Character of cost 7 does not widen the range', () => {
    const g = play([SCN.c7], [SCN.c3, SCN.c5, SCN.c6]);
    expect(offeredIds(g)).toEqual([SCN.c3]);
  });

  it('a rested cost-8 Character of mine counts', () => {
    const g = play([{ card: SCN.c8, rested: true }], [SCN.c5, SCN.c6]);
    expect(offeredIds(g)).toEqual([SCN.c5, SCN.c6].sort());
  });

  it('an OPPOSING cost-8 Character does not widen the range: the condition is on my Characters', () => {
    const g = play([], [SCN.c3, SCN.c5, SCN.c8]);
    expect(offeredIds(g)).toEqual([SCN.c3]);
  });

  it('current cost counts: Morley (4 +4 under a Revolutionary Army Leader = 8) of mine widens the range', () => {
    const g = play(['OP12-093'], [SCN.c5, SCN.c6], LDR.ra);
    expect(offeredIds(g)).toEqual([SCN.c5, SCN.c6].sort());
  });

  it('the same Morley without the Leader (cost 4) does not', () => {
    const g = play(['OP12-093'], [SCN.c3, SCN.c5, SCN.c6]);
    expect(offeredIds(g)).toEqual([SCN.c3]);
  });
});

describe('OP12-096 Ursa Shock: [Trigger] draw 1 card and trash 1 card from the top of the deck', () => {
  function triggered() {
    const g = theirs(
      LDR.luffy,
      { life: [EVENT, SCN.c1, SCN.c1, SCN.c1], deck: topDeck([SCN.c2, SCN.c3]) },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('activating draws the top card, then trashes the next one from the top of the deck', () => {
    const g = triggered();
    activateTrigger(g);
    expect(hand(g)).toEqual([SCN.c2]);
    expect(trash(g)).toEqual([SCN.c3, EVENT].sort());
    expect(deck(g)).toHaveLength(10);
    expect(g.life('p1')).toBe(3);
    expect(kind(g)).toBe('main');
  });

  it('declining: the Life card goes to my hand and the deck is untouched', () => {
    const g = triggered();
    declineTrigger(g);
    expect(hand(g)).toEqual([EVENT]);
    expect(deck(g)).toHaveLength(12);
    expect(trash(g)).toEqual([]);
  });

  it('the trashed card comes from the deck, not from my hand', () => {
    const g = triggered();
    activateTrigger(g);
    expect(hand(g)).toHaveLength(1);
    expect(at(g, 'p1', 'trash', SCN.c3)).toBeTruthy();
  });
});
