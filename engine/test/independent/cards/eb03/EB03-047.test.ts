/**
 * EB03-047 Miss.Valentine(Mikita) (Character, Black, cost 2, 2000, Counter +1000, {Baroque Works}).
 *
 * Card text: "[On Play] Trash 3 cards from the top of your deck.
 * [On K.O.] Draw 1 card."
 *
 * Rules: CR 1-3-2 (do as much as possible), CR 9-2-1-2 (0 cards in the deck loses at once, also by
 * trashing the last cards), [On K.O.] triggers whenever it is K.O.'d (either turn).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, noDefence, result } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  C14,
  deck,
  hand,
  kind,
  LB,
  mine,
  need,
  noDefenceUntilTrigger,
  put,
  theirs,
  trash,
} from './kit-eb03b.ts';

const ID = 'EB03-047';
const MARCO = C14.marco;
const SAI = C14.sai;
const HAJRUDIN = C14.hajrudin;

describe('EB03-047 Miss.Valentine: [On Play] trash 3 from the top of the deck; [On K.O.] draw 1', () => {
  it('[On Play] trashes exactly the top 3 cards of the deck, in no particular order', () => {
    const g = mine(LB.luffy, { hand: [ID], deck: [MARCO, SAI, HAJRUDIN, BLUE, BLUE, BLUE] });
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(trash(g).sort()).toEqual([HAJRUDIN, MARCO, SAI].sort());
    expect(deck(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('[On Play] asks nothing and draws nothing', () => {
    const g = mine(LB.luffy, { hand: [ID] });
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(12);
  });

  it('with exactly 4 cards in the deck the play leaves 1 card and the game continues', () => {
    const g = mine(LB.luffy, { hand: [ID], deck: [MARCO, SAI, HAJRUDIN, BLUE] });
    put(g, ID);
    expect(deck(g)).toEqual([BLUE]);
    expect(result(g)).toBeNull();
  });

  it('with exactly 3 cards in the deck all three are trashed and the empty deck loses the game (CR 9-2-1-2)', () => {
    const g = mine(LB.luffy, { hand: [ID], deck: [MARCO, SAI, HAJRUDIN] });
    put(g, ID);
    expect(deck(g)).toEqual([]);
    expect(JSON.stringify(result(g))).toContain('p2');
  });

  it('with only 2 cards in the deck it trashes the 2 it can (as much as possible)', () => {
    const g = mine(LB.luffy, { hand: [ID], deck: [MARCO, SAI] });
    put(g, ID);
    expect(deck(g)).toEqual([]);
    expect(trash(g).sort()).toEqual([MARCO, SAI].sort());
  });

  it("[On K.O.] K.O.'d in battle on the opponent's turn: draws 1 card", () => {
    const g = theirs(LB.luffy, {
      characters: [{ card: ID, rested: true }],
      deck: [MARCO, BLUE, BLUE],
    });
    attack(g, g.leader('p2'), g.find('p1', 'characters', ID));
    noDefence(g);
    expect(g.zone('p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([MARCO]);
    expect(deck(g)).toEqual([BLUE, BLUE]);
  });

  it("[On K.O.] also draws when it is K.O.'d on my own turn (here by the opponent's Life [Trigger] OP15-115)", () => {
    const g = mine(
      LB.luffy,
      { characters: [ID], deck: [MARCO, BLUE, BLUE] },
      { life: ['OP15-115', BLUE, BLUE, BLUE] },
    );
    attack(g, g.leader('p1'), g.leader('p2'));
    noDefenceUntilTrigger(g);
    need(g, 'trigger', 'p2');
    act(g, { type: 'trigger', activate: true });
    // The K.O. target is p2's pick when the engine asks (a sole candidate may be taken by itself).
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.find('p1', 'characters', ID) });
    expect(g.zone('p1', 'characters')).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([MARCO]);
  });

  it("[On K.O.] only: she stays in play and nothing is drawn when the opponent's attack goes to my Leader instead", () => {
    const g = theirs(LB.luffy, { characters: [ID], deck: [MARCO, BLUE, BLUE] });
    attack(g, g.leader('p2'), g.leader('p1'));
    noDefence(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(deck(g)).toEqual([MARCO, BLUE, BLUE]);
  });
});
