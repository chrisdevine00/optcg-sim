/**
 * EB03-046 Miss Doublefinger(Zala) (Character, Black, cost 4, 5000, Counter +1000, {Baroque Works}).
 *
 * Card text: "[On Play] If there is a Character with a cost of 0 or with a cost of 8 or more, draw 1
 * card. [On K.O.] Trash 2 cards from the top of your deck."
 *
 * Rules: "there is a Character" reads either field and current cost (M4b-7, closed 2026-11-16;
 * the cost of 4 of Doublefinger herself does not qualify), CR 1-3-2 (do as much as possible: a
 * deck with 1 card trashes 1), [On K.O.] triggers wherever the K.O. happens.
 * A cost of 0 is produced by OP17-097 ("Give all of your opponent's Characters −1 cost during this
 * turn") on an opposing cost-1 Character.
 */
import { describe, expect, it } from 'vitest';
import { attack, noDefence, result } from '../../helpers.ts';
import { atMain, BLUE, C14, deck, hand, LB, mine, put, theirs, trash } from './kit-eb03b.ts';

const ID = 'EB03-046';
const COST7 = 'OP02-020'; // LittleOars Jr.: cost 7, 9000, vanilla
const COST8 = 'OP12-005'; // Shiki: cost 8, 10000, vanilla
const COST1 = 'OP02-060'; // Mohji: cost 1, 3000, vanilla
const RAGE = 'OP17-097'; // Black Event, cost 1: [Main] give all of the opponent's Characters −1 cost this turn
const MARCO = C14.marco;

function start(o: { mine?: string[]; p2?: string[]; hand?: string[] }) {
  return mine(
    LB.luffy,
    {
      hand: [ID, ...(o.hand ?? [])],
      characters: o.mine ?? [],
      costArea: { active: 10, rested: 0 },
    },
    { characters: o.p2 ?? [] },
  );
}

describe('EB03-046 Miss Doublefinger: [On Play] if a Character has cost 0 or 8+, draw 1; [On K.O.] trash 2 from the top of the deck', () => {
  it("an opponent's Character with cost 8: draws 1", () => {
    const g = start({ p2: [COST8] });
    const top = deck(g)[0];
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([top]);
    expect(deck(g)).toHaveLength(14);
  });

  it('one of my own Characters with cost 8 also counts (the check is not limited to the opponent)', () => {
    const g = start({ mine: [COST8] });
    put(g, ID);
    expect(hand(g)).toHaveLength(1);
  });

  it('cost 7 is not enough (boundary): nothing is drawn', () => {
    const g = start({ mine: [COST7], p2: [COST7] });
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(15);
  });

  it('a Character with cost 0 counts: an opposing cost-1 Character lowered to 0 by OP17-097 this turn', () => {
    const g = start({ hand: [RAGE], p2: [COST1] });
    put(g, RAGE);
    expect(g.card(g.find('p2', 'characters', COST1)).cost).toBe(0);
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toHaveLength(1);
  });

  it('a cost of 1 is not a cost of 0: a cost-1 Character alone does nothing', () => {
    const g = start({ p2: [COST1], mine: [MARCO] });
    put(g, ID);
    expect(hand(g)).toEqual([]);
  });

  it('with no other Character the effect does nothing (Doublefinger herself has cost 4)', () => {
    const g = start({});
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
  });

  it('asks nothing: the draw is mandatory when the condition holds', () => {
    const g = start({ p2: [COST8] });
    put(g, ID);
    expect(atMain(g)).toBe(true);
  });

  it("[On K.O.] on the opponent's turn: the top 2 cards of my deck are trashed", () => {
    const g = theirs(LB.luffy, {
      characters: [{ card: ID, rested: true }],
      deck: [MARCO, C14.sai, BLUE, BLUE, BLUE],
    });
    attack(g, g.leader('p2'), g.find('p1', 'characters', ID));
    noDefence(g);
    expect(g.zone('p1', 'characters')).toEqual([]);
    expect(trash(g).sort()).toEqual([C14.sai, ID, MARCO].sort());
    expect(deck(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('[On K.O.] with only 1 card left in the deck: it trashes that card (as much as possible) and the empty deck loses the game', () => {
    const g = theirs(LB.luffy, { characters: [{ card: ID, rested: true }], deck: [MARCO] });
    attack(g, g.leader('p2'), g.find('p1', 'characters', ID));
    noDefence(g);
    expect(deck(g)).toEqual([]);
    expect(trash(g).sort()).toEqual([ID, MARCO].sort());
    // Milling the last card leaves 0 cards in the deck: defeat by rules processing (CR 9-2-1-2).
    expect(JSON.stringify(result(g))).toContain('p2');
  });

  it('playing the card does not trash anything from the deck (the mill is [On K.O.] only)', () => {
    const g = start({ p2: [COST8] });
    put(g, ID);
    expect(trash(g)).toEqual([]);
  });
});
