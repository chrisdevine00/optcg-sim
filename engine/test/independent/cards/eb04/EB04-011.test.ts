/**
 * EB04-011 Scaled Neptunian (Character, Green, cost 7, 8000, Counter +1000, {Neptunian}).
 *
 * Card text: "[Rush: Character] (This card can attack Characters on the turn in which it is played.)
 * [On Play] Draw a card for each of your {Neptunian} type Characters. Then, trash the same number of
 * cards from your hand."
 *
 * Rules: [Rush: Character]; on play the Character itself is on the field, so it counts as one of
 * "your {Neptunian} type Characters"; only my Characters count (rested or not); the player picks
 * which hand cards to trash (any card, including the ones just drawn).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  canHit,
  cardIds,
  choices,
  decision,
  hand,
  kind,
  LE,
  mine,
  need,
  playRaw,
  SN,
  trash,
} from './kit-eb04a.ts';

const SCALED = 'EB04-011';
const DECK = [SN.c3, SN.c4, SN.c5, SN.c6, SN.c7, SN.c8];

/** Trash these card ids from hand one prompt at a time ("trash N cards" is asked once per card). */
function trashCards(g: ReturnType<typeof mine>, cards: string[]) {
  for (const c of cards) {
    need(g, 'choose');
    expect(decision(g)!.player).toBe('p1');
    const hit = choices(g).find((i) => g.card(i).card === c);
    if (!hit) throw new Error(`${c} is not offered for the trash`);
    act(g, { type: 'pick', choice: hit });
  }
}

function start(p1: Parameters<typeof mine>[1] = {}, p2: Parameters<typeof mine>[2] = {}) {
  const g = mine(LE.fishMan, { hand: [SCALED, SN.c1, SN.c2], deck: DECK, ...p1 }, p2);
  playRaw(g, SCALED);
  return g;
}

describe('EB04-011 Scaled Neptunian: [On Play] draw 1 per {Neptunian} Character, then trash as many', () => {
  it('printed values: cost 7, 8000, Counter +1000, a Rush keyword', () => {
    const g = mine(LE.fishMan, { hand: [SCALED] }, {});
    const c = g.card(g.find('p1', 'hand', SCALED));
    expect(c.cost).toBe(7);
    expect(c.power).toBe(8000);
    expect(c.counter).toBe(1000);
    expect(c.keywords.some((k) => k.startsWith('Rush'))).toBe(true);
  });

  it('alone it counts itself: draws 1 card (the top of the deck) and trashes 1 card from hand', () => {
    const g = start();
    trashCards(g, [SN.c1]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([SN.c2, SN.c3].sort());
    expect(trash(g)).toEqual([SN.c1]);
    expect(cardIds(g, 'p1', 'deck')).toEqual(DECK.slice(1));
  });

  it('with 2 other {Neptunian} Characters: draws 3 and trashes 3', () => {
    const g = start({ characters: [SN.nept6, SN.nept7] });
    expect(cardIds(g, 'p1', 'hand').sort()).toEqual(
      [SN.c1, SN.c2, DECK[0], DECK[1], DECK[2]].sort(),
    );
    trashCards(g, [SN.c1, SN.c2, DECK[0]!]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([DECK[1], DECK[2]].sort());
    expect(trash(g).sort()).toEqual([SN.c1, SN.c2, DECK[0]].sort());
  });

  it('the cards just drawn may be trashed', () => {
    const g = start();
    trashCards(g, [DECK[0]!]);
    expect(hand(g)).toEqual([SN.c1, SN.c2].sort());
    expect(trash(g)).toEqual([DECK[0]]);
  });

  it('must not happen: a Character of another type does not add a draw', () => {
    const g = start({ characters: [SN.jinbe4, SN.c3] });
    trashCards(g, [SN.c1]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toHaveLength(2);
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(DECK.length - 1);
  });

  it('must not happen: the opponent {Neptunian} Characters do not count', () => {
    const g = start({}, { characters: [SN.nept6, SN.nept7] });
    trashCards(g, [SN.c1]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(DECK.length - 1);
  });

  it('a rested {Neptunian} Character counts', () => {
    const g = start({ characters: [{ card: SN.nept6, rested: true }] });
    trashCards(g, [SN.c1, SN.c2]);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'deck')).toHaveLength(DECK.length - 2);
    expect(hand(g)).toHaveLength(2);
  });

  it('[Rush: Character]: the turn it is played it can attack a rested opposing Character but not the Leader', () => {
    const g = start({}, { characters: [{ card: SN.c4, rested: true }] });
    trashCards(g, [SN.c1]);
    const me = at(g, 'p1', 'characters', SCALED);
    expect(canHit(g, me, at(g, 'p2', 'characters', SN.c4))).toBe(true);
    expect(canHit(g, me, g.leader('p2'))).toBe(false);
  });
});
