/**
 * OP14-074 Monet (Character, Purple, cost 5, 6000, Counter +1000, {Donquixote Pirates}/{Punk Hazard}).
 *
 * Card text: "[On Play] If your Leader has the {Donquixote Pirates} type, add up to 1 DON!! card from
 * your DON!! deck and set it as active.
 * [On K.O.] Draw 2 cards and trash 1 card from your hand. Then, add up to 2 DON!! cards from your
 * DON!! deck and rest them."
 *
 * Rules: "add up to N DON!!" asks a count; "trash 1 card from your hand" is an exact pick from the
 * whole hand, including the cards just drawn; the drawn cards leave the deck top first.
 */
import { describe, expect, it } from 'vitest';
import {
  addDon,
  at,
  backToMain,
  BLUE,
  chars,
  countOptions,
  deck,
  donOf14,
  hand,
  kind,
  koGame,
  LD14,
  mine,
  need,
  offeredIds,
  pickCards,
  decision,
  playRaw,
  SC14,
  trash,
  asksCount,
} from './kit-op14c.ts';

const ID = 'OP14-074';
const D1 = SC14.c2; // top of deck
const D2 = SC14.c3;

/** Monet (6000) K.O.'d by their Kingdew (7000); my hand `h`, deck top D1, D2, then Mohji. */
function ko(h: string[], o: { donDeckSize?: number; deckCards?: string[] } = {}) {
  const active = o.donDeckSize === undefined ? 3 : 10 - o.donDeckSize;
  return koGame(ID, {
    strong: true,
    p1: {
      hand: h,
      deck: o.deckCards ?? [D1, D2, ...Array.from({ length: 10 }, () => BLUE)],
      costArea: { active, rested: 0 },
    },
  });
}

describe('OP14-074 Monet [On Play] if {Donquixote Pirates} Leader: add up to 1 active DON!!', () => {
  it('with a {Donquixote Pirates} Leader: asks a count, adding 1 gives an ACTIVE DON!!', () => {
    const g = mine(LD14.dp, { hand: [ID], costArea: { active: 8, rested: 0 } });
    playRaw(g, ID);
    expect(countOptions(g).sort()).toEqual(['0', '1']);
    addDon(g, 1);
    backToMain(g, 'p1');
    expect(donOf14(g)).toMatchObject({ active: 4, rested: 5, deck: 1 });
  });

  it('with another Leader nothing is asked or added', () => {
    const g = mine(LD14.plain, { hand: [ID], costArea: { active: 8, rested: 0 } });
    playRaw(g, ID);
    backToMain(g, 'p1');
    expect(donOf14(g)).toMatchObject({ active: 3, rested: 5, deck: 2 });
    expect(chars(g)).toEqual([ID]);
  });
});

describe('OP14-074 Monet [On K.O.] draw 2, trash 1, then add up to 2 rested DON!!', () => {
  it('draws exactly 2 cards, trashes exactly 1 from the hand (my choice), then asks for the DON!! count', () => {
    const g = ko([SC14.c1]);
    expect(decision(g)).toMatchObject({ min: 1, max: 1 });
    pickCards(g, [SC14.c1]);
    // Hand: Komachiyo + the two drawn cards; Komachiyo was trashed.
    need(g, 'choose', 'p1');
    expect(asksCount(g)).toBe(true);
    expect(hand(g)).toEqual([D1, D2].sort());
    expect(trash(g)).toEqual([ID, SC14.c1].sort());
    expect(deck(g)[0]).toBe(BLUE);
  });

  it('the trash pick covers the whole hand, the just-drawn cards included', () => {
    const g = ko([SC14.c1]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c1, D1, D2].sort());
    pickCards(g, [D2]);
    addDon(g, 0);
    expect(hand(g)).toEqual([SC14.c1, D1].sort());
  });

  it('with an empty hand the 2 drawn cards are the only candidates: 1 is trashed, 1 kept', () => {
    const g = ko([]);
    if (kind(g) === 'choose' && !asksCount(g)) pickCards(g, [D1]);
    expect(hand(g)).toEqual([D2]);
    expect(trash(g)).toEqual([ID, D1].sort());
  });

  it('then adds up to 2 DON!! RESTED: choosing 2 puts 2 rested DON!! in the cost area', () => {
    const g = ko([SC14.c1]);
    pickCards(g, [SC14.c1]);
    expect(countOptions(g).sort()).toEqual(['0', '1', '2']);
    const before = donOf14(g);
    addDon(g, 2);
    backToMain(g, 'p2');
    expect(donOf14(g)).toMatchObject({
      active: before.active,
      rested: before.rested + 2,
      deck: before.deck - 2,
    });
  });

  it('"up to 2": 1 and none are possible', () => {
    const g = ko([SC14.c1]);
    pickCards(g, [SC14.c1]);
    const before = donOf14(g);
    addDon(g, 1);
    expect(donOf14(g).rested).toBe(before.rested + 1);
    const h = ko([SC14.c1]);
    pickCards(h, [SC14.c1]);
    addDon(h, 0);
    expect(donOf14(h).rested).toBe(before.rested);
    backToMain(h, 'p2');
  });

  it('with only 1 DON!! left in the DON!! deck at most 1 can be added', () => {
    const g = ko([SC14.c1], { donDeckSize: 1 });
    pickCards(g, [SC14.c1]);
    if (asksCount(g)) {
      const opts = countOptions(g);
      expect(opts).not.toContain('2');
      addDon(g, 1);
    }
    expect(donOf14(g)).toMatchObject({ rested: 1, deck: 0 });
  });

  it('with an empty DON!! deck the cards are still drawn and trashed', () => {
    const g = ko([SC14.c1], { donDeckSize: 0 });
    pickCards(g, [SC14.c1]);
    if (asksCount(g)) addDon(g, 0);
    backToMain(g, 'p2');
    expect(hand(g)).toEqual([D1, D2].sort());
    expect(trash(g)).toEqual([ID, SC14.c1].sort());
  });

  it('it needs no {Donquixote Pirates} Leader: [On K.O.] works under any Leader', () => {
    const g = koGame(ID, {
      leader: LD14.plain,
      strong: true,
      p1: { hand: [SC14.c1], deck: [D1, D2, BLUE, BLUE, BLUE] },
    });
    pickCards(g, [SC14.c1]);
    addDon(g, 2);
    expect(hand(g)).toEqual([D1, D2].sort());
  });

  it('must not fire on play: playing Monet draws nothing', () => {
    const g = mine(LD14.dp, { hand: [ID], costArea: { active: 8, rested: 0 } });
    playRaw(g, ID);
    addDon(g, 0);
    expect(hand(g)).toEqual([]);
    expect(at(g, 'p1', 'characters', ID)).toBeTruthy();
  });
});
