/**
 * EB02-048 Brook (Black Character, cost 5, 6000, Counter +1000, {Straw Hat Crew}).
 *
 * Card text: "[On Play] Add up to 1 [Laboon] from your trash to your hand. [On K.O.] Play up to 1 [Laboon]
 * with a cost of 4 or less from your hand."
 *
 * Rules: [Laboon] is an exact name match (CR 2-1-2), so any card named Laboon qualifies; "up to 1" may
 * be 0; [On K.O.] fires when this Character is K.O.'d (battle or effect) and plays from the HAND; an
 * "up to" pick over the hand with a filter is asked even when no card matches or the hand is empty.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  canFinish,
  chars,
  hand,
  kind,
  LE,
  mine,
  need,
  noDefence,
  none,
  offeredIds,
  opponentKOs,
  pickCards,
  playRaw,
  SE,
  skipEmptyPick,
  theirs,
  trash,
  choices,
  decision,
  kw,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const BROOK = 'EB02-048';
/** EB01-048 Laboon: Black, cost 4, 5000, {Animal}; also named [Laboon]. Only an [Activate: Main]. */
const LABOON2 = 'EB01-048';

/** p1 plays Brook with `trashCards` in the trash. */
function played(trashCards: string[]) {
  const g = mine(LE.luffy, { hand: [BROOK], trash: trashCards });
  playRaw(g, BROOK);
  return g;
}

/** p2 attacks Brook (rested) with a 7000 Character; p1 does not block or counter. Returns the game at p1's [On K.O.]. */
function koInBattle(handCards: string[]) {
  const g = theirs(
    LE.luffy,
    { characters: [{ card: BROOK, rested: true }], hand: handCards },
    { characters: [SE.kingdew] },
  );
  attack(g, ch(g, 'p2', SE.kingdew), ch(g, 'p1', BROOK));
  noDefence(g);
  return g;
}

describe('EB02-048 Brook: printed values', () => {
  it('cost 5, 6000 power, Counter +1000, no keyword', () => {
    const g = mine(LE.luffy, { characters: [BROOK] });
    const b = ch(g, 'p1', BROOK);
    expect(g.card(b).cost).toBe(5);
    expect(g.power(b)).toBe(6000);
    expect(g.card(b).counter).toBe(1000);
    expect(kw(g, b)).toEqual([]);
  });
});

describe('EB02-048 Brook: [On Play] add up to 1 [Laboon] from the trash to the hand', () => {
  it('offers every card named Laboon in the trash and nothing else', () => {
    const g = played([SE.laboon, LABOON2, SE.mohji, SE.kalifa5]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.laboon, LABOON2].sort());
  });

  it('adds the chosen Laboon to the hand and leaves the rest of the trash', () => {
    const g = played([SE.laboon, SE.mohji]);
    pickCards(g, [SE.laboon]);
    expect(hand(g)).toEqual([SE.laboon]);
    expect(trash(g)).toEqual([SE.mohji]);
    expect(chars(g)).toEqual([BROOK]);
  });

  it('adds at most 1 card even with two Laboon in the trash', () => {
    const g = played([SE.laboon, LABOON2]);
    pickCards(g, [LABOON2]);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([LABOON2]);
    expect(trash(g)).toEqual([SE.laboon]);
  });

  it('"up to 1": may add nothing', () => {
    const g = played([SE.laboon]);
    need(g, 'choose', 'p1');
    none(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SE.laboon]);
  });

  it('with no Laboon in the trash nothing is added', () => {
    const g = played([SE.mohji, SE.kalifa5]);
    skipEmptyPick(g);
    expect(kind(g)).toBe('main');
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([SE.mohji, SE.kalifa5].sort());
  });

  it('must not: the added Laboon goes to the hand, it is not played', () => {
    const g = played([SE.laboon]);
    pickCards(g, [SE.laboon]);
    expect(chars(g)).toEqual([BROOK]);
  });

  it("must not: the opponent's trash is not a source", () => {
    const g = mine(LE.luffy, { hand: [BROOK] }, { trash: [SE.laboon] });
    playRaw(g, BROOK);
    skipEmptyPick(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g, 'p2')).toEqual([SE.laboon]);
  });
});

describe('EB02-048 Brook: [On K.O.] play up to 1 [Laboon] with a cost of 4 or less from the hand', () => {
  it("K.O.'d in battle: offers the Laboon in hand and plays it active", () => {
    const g = koInBattle([SE.laboon, SE.mohji]);
    expect(chars(g)).toEqual([]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.laboon]);
    pickCards(g, [SE.laboon]);
    expect(chars(g)).toEqual([SE.laboon]);
    expect(g.card(ch(g, 'p1', SE.laboon)).rested).toBe(false);
    expect(hand(g)).toEqual([SE.mohji]);
    expect(trash(g)).toEqual([BROOK]);
  });

  it("K.O.'d by an effect also fires [On K.O.]", () => {
    const g = theirs(
      LE.luffy,
      { characters: [BROOK], hand: [SE.laboon] },
      {
        hand: ['OP09-077'],
        characters: [],
      },
    );
    opponentKOs(g, ch(g, 'p1', BROOK));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.laboon]);
    pickCards(g, [SE.laboon]);
    expect(chars(g)).toEqual([SE.laboon]);
  });

  it('"up to 1": may play nothing', () => {
    const g = koInBattle([SE.laboon]);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SE.laboon]);
  });

  it('plays at most 1 even with two Laboon in hand', () => {
    const g = koInBattle([SE.laboon, LABOON2]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.laboon, LABOON2].sort());
    pickCards(g, [SE.laboon]);
    expect(chars(g)).toEqual([SE.laboon]);
    expect(hand(g)).toEqual([LABOON2]);
  });

  it('a non-Laboon card in hand is not offered, but the "up to" pick is still asked (hand is hidden)', () => {
    const g = koInBattle([SE.mohji, SE.komachiyo]);
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(d?.player).toBe('p1');
    expect(choices(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SE.mohji, SE.komachiyo].sort());
  });

  it('with an empty hand the "up to" pick is still asked', () => {
    const g = koInBattle([]);
    expect(decision(g)?.kind).toBe('choose');
    expect(canFinish(g)).toBe(true);
    expect(choices(g)).toEqual([]);
  });

  it('must not: a Laboon in the trash is not played by [On K.O.]', () => {
    const g = theirs(
      LE.luffy,
      { characters: [{ card: BROOK, rested: true }], hand: [], trash: [SE.laboon] },
      { characters: [SE.kingdew] },
    );
    attack(g, ch(g, 'p2', SE.kingdew), ch(g, 'p1', BROOK));
    noDefence(g);
    expect(choices(g)).toEqual([]);
    if (kind(g) === 'choose') act(g, { type: 'done' });
    expect(chars(g)).toEqual([]);
  });
});
