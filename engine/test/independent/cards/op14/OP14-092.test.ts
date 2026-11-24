/**
 * OP14-092 Mr.3(Galdino) (Character, Black, cost 4, 6000, no Counter, {Baroque Works}).
 *
 * Card text: "[Opponent's Turn] [Once Per Turn] If this Character would be K.O.'d, you may place 3 cards
 * from your trash at the bottom of your deck in any order instead."
 *
 * Rules: CR 8-1-3-4 (replacement: "instead", optional with "may"), CR 8-1-3-4-1 (declining means it
 * does not resolve), CR 10-2-13 ([Once Per Turn]), CR 3-1-7 (owner orders cards placed together),
 * CR 8-3-1-3 (an unpayable cost cannot be paid at all).
 */
import { describe, expect, it } from 'vitest';
import {
  activate,
  at,
  atMain,
  attack,
  BW,
  chars,
  deck,
  decision,
  hasEvent,
  kind,
  LD14,
  need,
  no,
  opponentKOs,
  payHand,
  SC14,
  settleOrders,
  tail,
  theirs,
  trash,
  unusable,
  yes,
  mine,
  none,
  pickInst,
} from './kit-op14d.ts';
import { act } from './kit-op14d.ts';

const ID = BW.galdino;
const T = [SC14.c2, SC14.c4, SC14.c6, SC14.c7];

function setup(trashCards: string[] = T, p2: string[] = [SC14.c5, SC14.c6]) {
  return theirs(
    LD14.bw,
    { characters: [{ card: ID, rested: true }], trash: trashCards },
    { characters: p2 },
  );
}

/** p2's Character attacks Galdino; nobody blocks or counters. Stops at the next decision. */
function hit(g: ReturnType<typeof setup>, attackerCard: string = SC14.c5) {
  attack(g, g.find('p2', 'characters', attackerCard), g.find('p1', 'characters', ID));
  need(g, 'block', 'p1');
  act(g, { type: 'block', blocker: null });
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
}

describe("OP14-092 Mr.3(Galdino): [Opponent's Turn] [Once Per Turn] K.O. replacement", () => {
  it('a battle K.O. is offered the replacement; accepting keeps Galdino on the field and moves exactly 3 trash cards to the bottom', () => {
    const g = setup();
    hit(g);
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SC14.c2, SC14.c4, SC14.c6]);
    settleOrders(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([SC14.c7]);
    expect(tail(deck(g), 3)).toEqual([SC14.c2, SC14.c4, SC14.c6].sort());
    expect(hasEvent(g, 'ReplacementApplied')).toBe(true);
  });

  it('declining: Galdino is K.O.d as usual and the trash is untouched', () => {
    const g = setup();
    hit(g);
    need(g, 'optional', 'p1');
    no(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([...T, ID].sort());
  });

  it('exactly 3 cards in the trash is enough: all 3 go to the bottom', () => {
    const g = setup([SC14.c2, SC14.c4, SC14.c6]);
    hit(g);
    yes(g);
    // With exactly 3 candidates the pick is forced: the engine may or may not ask it.
    if (kind(g) === 'choose') payHand(g, [SC14.c2, SC14.c4, SC14.c6]);
    settleOrders(g, 'p1');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([]);
    expect(tail(deck(g), 3)).toEqual([SC14.c2, SC14.c4, SC14.c6].sort());
  });

  it("only 2 cards in my trash: the replacement cannot be used and Galdino is K.O.d (the opponent's trash does not count)", () => {
    const g = theirs(
      LD14.bw,
      { characters: [{ card: ID, rested: true }], trash: [SC14.c2, SC14.c4] },
      { characters: [SC14.c5], trash: [SC14.c2, SC14.c4, SC14.c6, SC14.c7, SC14.c8] },
    );
    hit(g);
    unusable(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, SC14.c2, SC14.c4].sort());
  });

  it('[Once Per Turn]: the first K.O. is replaced, a second attack on it the same turn is not', () => {
    const g = setup([...T, SC14.c8, SC14.c9]);
    hit(g, SC14.c5);
    yes(g);
    payHand(g, [SC14.c2, SC14.c4, SC14.c6]);
    settleOrders(g, 'p1');
    expect(chars(g)).toEqual([ID]);
    hit(g, SC14.c6);
    if (kind(g) === 'optional') unusable(g, 'p1');
    expect(decision(g)?.purpose).not.toBe('replacement');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toContain(ID);
  });

  it("an opponent's effect K.O. is replaced too", () => {
    const g = theirs(LD14.bw, { characters: [ID], trash: T }, { hand: ['OP09-077'] });
    opponentKOs(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SC14.c2, SC14.c4, SC14.c6]);
    settleOrders(g, 'p1');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toEqual([SC14.c7]);
  });

  it('only the three chosen cards move: which ones is my choice', () => {
    const g = setup();
    hit(g);
    yes(g);
    payHand(g, [SC14.c4, SC14.c6, SC14.c7]);
    settleOrders(g, 'p1');
    expect(trash(g)).toEqual([SC14.c2]);
    expect(tail(deck(g), 3)).toEqual([SC14.c4, SC14.c6, SC14.c7].sort());
  });

  it('protects only itself: another Baroque Works Character K.O.d in the same way is not replaced', () => {
    const g = theirs(
      LD14.bw,
      {
        characters: [
          { card: ID, rested: true },
          { card: BW.mr9, rested: true },
        ],
        trash: T,
      },
      { characters: [SC14.c5] },
    );
    attack(g, g.find('p2', 'characters', SC14.c5), g.find('p1', 'characters', BW.mr9));
    need(g, 'block', 'p1');
    act(g, { type: 'block', blocker: null });
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(decision(g)?.purpose).not.toBe('replacement');
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toContain(BW.mr9);
  });

  it('must not apply on my own turn: a K.O. of Galdino during my turn (OP14-079 cost) just K.O.s it', () => {
    const g = mine(LD14.bwKo, { characters: [ID], trash: T }, { characters: [SC14.c5] });
    activate(g, g.leader('p1'));
    for (let i = 0; i < 6 && !atMain(g); i++) {
      const d = decision(g);
      expect(d?.purpose).not.toBe('replacement');
      if (d?.kind === 'choose' && d.purpose === 'cost')
        pickInst(g, [at(g, 'p1', 'characters', ID)]);
      else if (d?.kind === 'choose') none(g);
      else if (d?.kind === 'optional') no(g);
      else break;
    }
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toContain(ID);
  });
});
