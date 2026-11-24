/**
 * OP16-098 Yamato (Character, Black, cost 6, 5000, Counter +1000, {Land of Wano}).
 *
 * Card text: "[On Play] Draw 1 card and trash 1 card from your hand. [Activate:Main] You may trash this
 * Character: Play up to 1 black [Yamato] with a cost of 8 from your trash."
 *
 * Rules: CR 8-3-1-3 (cost), CR 8-4-4-1 ("up to"), CR 3-7-6 (five Character areas).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  chars,
  choices,
  deck,
  deckOf,
  hand,
  kind,
  LD16,
  mayChooseNone,
  need,
  none,
  offeredAbilities,
  offeredIds,
  p1main,
  pickCards,
  playIt,
  SC16,
  trash,
  useAbility,
} from './kit-op16c.ts';

const ID = 'OP16-098';
const Y96 = 'OP16-096'; // Black, cost 8, [Yamato], [Unblockable]
const Y97 = 'OP16-097'; // Black, cost 8, [Yamato], [On Play] adds/plays
const Y5 = 'ST09-013'; // Yellow, cost 5, [Yamato], vanilla

describe('OP16-098 Yamato: [On Play] draw 1, trash 1 from hand', () => {
  function played(h: string[]) {
    const g = p1main(LD16.wano, { hand: [ID, ...h], deck: deckOf([SC16.wano1, SC16.wano3]) });
    playIt(g, ID);
    return g;
  }

  it('draws 1, then trashes 1 card of my choice from the enlarged hand', () => {
    const g = played([SC16.wano5]);
    need(g, 'choose', 'p1');
    pickCards(g, [SC16.wano5]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([SC16.wano5]);
    expect(hand(g)).toEqual([SC16.wano1]);
    expect(deck(g)).toHaveLength(11);
  });

  it('the card just drawn may be the one trashed', () => {
    const g = played([SC16.wano5]);
    pickCards(g, [SC16.wano1]);
    expect(trash(g)).toEqual([SC16.wano1]);
    expect(hand(g)).toEqual([SC16.wano5]);
  });

  it('the trash is exactly 1 (not "up to"): it cannot be skipped', () => {
    const g = played([SC16.wano5]);
    expect(mayChooseNone(g)).toBe(false);
    expect(choices(g)).toHaveLength(2);
  });

  it('with an otherwise empty hand, the drawn card is the only choice and is trashed', () => {
    const g = played([]);
    if (kind(g) === 'choose') pickCards(g, [SC16.wano1]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SC16.wano1]);
  });
});

describe('OP16-098 Yamato: [Activate:Main] may trash this: play a black [Yamato] with cost 8 from the trash', () => {
  function board(tr: string[], field: string[] = []) {
    return p1main(LD16.wano, { characters: [ID, ...field], trash: tr, deck: deckOf([]) });
  }

  it('trashes itself and plays the chosen cost-8 [Yamato]', () => {
    const g = board([Y5, Y96]);
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickCards(g, [Y96]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([Y96]);
    expect(trash(g)).toEqual([ID, Y5].sort());
  });

  it('candidates: black [Yamato] with cost 8 only (both OP16-096 and OP16-097; not cost 5, not the trashed cost-6 self, not a non-Yamato cost-8 Character)', () => {
    const g = board([Y5, Y96, Y97, SC16.wano8]);
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(offeredIds(g)).toEqual([Y96, Y97].sort());
  });

  it('"up to 1": may play nothing; the cost (trashing itself) stays paid', () => {
    const g = board([Y96]);
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, Y96].sort());
  });

  it('plays only one even when two qualify', () => {
    const g = board([Y96, Y97]);
    useAbility(g, at(g, 'p1', 'characters', ID));
    pickCards(g, [Y96]);
    expect(chars(g)).toEqual([Y96]);
    expect(trash(g)).toEqual([ID, Y97].sort());
  });

  it('with no cost-8 black [Yamato] in the trash the cost can still be paid and nothing is played', () => {
    const g = board([Y5]);
    const c = at(g, 'p1', 'characters', ID);
    expect(offeredAbilities(g, c)).toHaveLength(1);
    useAbility(g, c);
    if (kind(g) === 'choose') none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, Y5].sort());
  });

  it('the Yamato it plays is on the field with 098 gone, so the Character count does not grow', () => {
    const field = [SC16.wano1, SC16.wano3, SC16.wano5, SC16.wano6];
    const g = board([Y96], field);
    useAbility(g, at(g, 'p1', 'characters', ID));
    pickCards(g, [Y96]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toHaveLength(5);
  });

  it('can be used the turn it was played (no summoning-sickness rule for [Activate: Main])', () => {
    const g = p1main(LD16.wano, {
      hand: [ID],
      trash: [Y96],
      deck: deckOf([SC16.wano1, SC16.wano3]),
    });
    playIt(g, ID);
    if (kind(g) === 'choose') pickCards(g, [SC16.wano1]);
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toHaveLength(1);
  });

  it('the played Yamato is not a K.O. and the trash cost is a trash: nothing else moves', () => {
    const g = board([Y96]);
    useAbility(g, at(g, 'p1', 'characters', ID));
    pickCards(g, [Y96]);
    expect(hand(g)).toEqual([]);
  });
});
