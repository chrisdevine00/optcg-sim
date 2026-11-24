/**
 * OP16-094 Portgas.D.Ace (Character, Black, cost 4, 5000, Counter +1000, {Land of Wano}/{Spade Pirates}).
 *
 * Card text: "[On K.O.] Your opponent trashes 2 cards from their hand. [Activate: Main] [Once Per Turn]
 * Give up to 1 rested DON!! card to 1 of your {Land of Wano} type Leader or Character cards."
 *
 * Rules: CR 10-2-13 ([Once Per Turn]), CR 8-4-4-1 ("up to"), CR 6-5-5 (given DON!!). The opponent
 * chooses the cards they trash (an instruction to a player is carried out by that player).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  BLUE,
  cardIds,
  choices,
  decision,
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
  SC16,
  SCN,
  theirs,
  theyKo,
  don,
  useAbility,
  choose,
  fill,
} from './kit-op16c.ts';

const ID = 'OP16-094';

function main(o: { leader?: string; field?: string[]; rested?: number } = {}) {
  return p1main(o.leader ?? LD16.wano, {
    characters: [ID, ...(o.field ?? [])],
    costArea: { active: 5, rested: o.rested ?? 3 },
  });
}

describe('OP16-094 Portgas.D.Ace: [Activate: Main] [Once Per Turn] give a rested DON!! to a {Land of Wano} Leader or Character', () => {
  it('gives a rested DON!! to my {Land of Wano} Leader', () => {
    const g = main();
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(LD16.wano);
    choose(g, [g.leader('p1')]);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g).rested).toBe(2);
    expect(don(g).active).toBe(5);
  });

  it('candidates: {Land of Wano} Leader and Characters only (Ace itself included); a non-{Land of Wano} Character is not offered', () => {
    const g = main({ field: [SC16.wano3, SCN.c4] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(offeredIds(g)).toEqual([ID, LD16.wano, SC16.wano3].sort());
  });

  it('a Leader without {Land of Wano} is not a candidate', () => {
    const g = main({ leader: LD16.plain, field: [SC16.wano3] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).toEqual([ID, SC16.wano3].sort());
  });

  it('only a rested DON!! is given: with all DON!! active nothing can be given', () => {
    const g = main({ rested: 0 });
    const ace = at(g, 'p1', 'characters', ID);
    if (offeredAbilities(g, ace).length) {
      useAbility(g, ace);
      if (kind(g) === 'choose') none(g);
    }
    expect(don(g).given).toBe(0);
    expect(don(g).active).toBe(5);
  });

  it('"up to 1": the DON!! may stay put', () => {
    const g = main();
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(don(g).given).toBe(0);
    expect(don(g).rested).toBe(3);
  });

  it('gives exactly 1 DON!!', () => {
    const g = main();
    useAbility(g, at(g, 'p1', 'characters', ID));
    choose(g, [g.leader('p1')]);
    expect(don(g).given).toBe(1);
  });

  it('[Once Per Turn]: not offered again after it was used', () => {
    const g = main();
    const ace = at(g, 'p1', 'characters', ID);
    useAbility(g, ace);
    choose(g, [g.leader('p1')]);
    expect(offeredAbilities(g, ace)).toEqual([]);
  });

  it("the opponent's Characters are never candidates", () => {
    const g = p1main(
      LD16.wano,
      { characters: [ID], costArea: { active: 5, rested: 3 } },
      { characters: [SC16.wano3] },
    );
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(offeredIds(g)).not.toContain(SC16.wano3);
  });
});

describe('OP16-094 Portgas.D.Ace: [On K.O.] my opponent trashes 2 cards from their hand', () => {
  function koed(oppHand: string[]) {
    const g = theirs(LD16.wano, { characters: [{ card: ID, rested: true }] }, { hand: oppHand });
    theyKo(g, at(g, 'p1', 'characters', ID));
    return g;
  }

  it('K.O. in battle: the opponent (not me) chooses and trashes 2 cards from their hand', () => {
    const g = koed([BLUE, SC16.wano3, SC16.wano5]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([ID]);
    need(g, 'choose', 'p2');
    pickCards(g, [SC16.wano3, SC16.wano5]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p2', 'trash').sort()).toEqual([SC16.wano3, SC16.wano5].sort());
    expect(hand(g, 'p2')).toEqual([BLUE]);
  });

  it('exactly 2: the opponent cannot stop at 1 while holding 3 cards', () => {
    const g = koed([BLUE, SC16.wano3, SC16.wano5]);
    need(g, 'choose', 'p2');
    expect(mayChooseNone(g)).toBe(false);
  });

  it('with only 1 card in hand the opponent trashes that card', () => {
    const g = koed([SC16.wano3]);
    if (kind(g) === 'choose') pickCards(g, [SC16.wano3]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g, 'p2')).toEqual([]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([SC16.wano3]);
  });

  it('with an empty hand nothing happens and the game moves on', () => {
    const g = koed([]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p2', 'trash')).toEqual([]);
  });

  it("the opponent's hand is trashed, mine is untouched", () => {
    const g = theirs(
      LD16.wano,
      { characters: [{ card: ID, rested: true }], hand: fill(SC16.wano1, 3) },
      { hand: [BLUE, BLUE, BLUE] },
    );
    theyKo(g, at(g, 'p1', 'characters', ID));
    pickCards(g, [BLUE, BLUE]);
    expect(hand(g, 'p1')).toHaveLength(3);
    expect(hand(g, 'p2')).toHaveLength(1);
    expect(decision(g)?.player).toBe('p2');
  });
});
