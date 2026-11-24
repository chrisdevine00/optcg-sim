/**
 * EB05-045 Ms. Monday (Character, Black, cost 2, 3000, Counter +1000, {Baroque Works}).
 *
 * Card text: "[On Play] K.O. up to 1 of your Characters with a type including "Baroque Works".
 * [On K.O.] Look at 3 cards from the top of your deck; reveal up to 1 card with a type including
 * "Baroque Works" and add it to your hand. Then, trash the rest."
 *
 * Rules: "a type including X" is a substring match, so {Former Baroque Works} counts; "your
 * Characters" includes Ms. Monday herself (she is on the field while her [On Play] resolves);
 * CR 8-4-4-1/-2 ("up to"; a hidden-area search may whiff); [On K.O.] fires for battle and effect
 * K.O.s (CR 8-1-3-1); "the rest" goes to the TRASH, not the bottom.
 */
import { describe, expect, it } from 'vitest';
import { fill, attack, passBlock } from '../../helpers.ts';
import {
  BLUE,
  CH,
  chars,
  checkLook,
  choices,
  choose,
  chooseNone,
  deck,
  hand,
  kind,
  LD,
  mine,
  playCard,
  settleYes,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-045';

function play(own: string[], opp: string[] = [], top: string[] = []) {
  const g = mine(
    LD.shc,
    { hand: [ID], characters: own, deck: [...top, ...fill(BLUE, 12)] },
    { characters: opp },
  );
  playCard(g, ID);
  return g;
}

describe('EB05-045 Ms. Monday [On Play]: K.O. up to 1 of my Characters with a type including "Baroque Works"', () => {
  it('offers my Baroque Works Characters (Mr.9, {Former Baroque Works} Crocodile) and Monday herself, nothing else', () => {
    const g = play([CH.mr9, CH.formerBw, CH.marco], [CH.mr9]);
    expect(choices(g).sort()).toEqual(
      [
        g.find('p1', 'characters', ID),
        g.find('p1', 'characters', CH.mr9),
        g.find('p1', 'characters', CH.formerBw),
      ].sort(),
    );
  });

  it('the chosen Character is K.O.’d and goes to the trash', () => {
    const g = play([CH.mr9, CH.marco]);
    choose(g, [g.find('p1', 'characters', CH.mr9)]);
    expect(chars(g)).toEqual([CH.marco, ID].sort());
    expect(trash(g)).toEqual([CH.mr9]);
  });

  it('"up to 1": choosing nothing K.O.s nothing', () => {
    const g = play([CH.mr9]);
    chooseNone(g);
    expect(chars(g)).toEqual([CH.mr9, ID].sort());
    expect(trash(g)).toEqual([]);
  });

  it('the opponent’s Baroque Works Characters are never offered (my Characters only)', () => {
    const g = play([], [CH.mr9]);
    expect(choices(g)).toEqual([g.find('p1', 'characters', ID)]);
  });

  it('Monday may K.O. herself; her own [On K.O.] then fires (look at 3, add a Baroque Works card, trash the rest)', () => {
    const g = play([], [], [CH.mr9, CH.mohji, CH.marco]);
    choose(g, [g.find('p1', 'characters', ID)]);
    expect(chars(g)).toEqual([]);
    expect(kind(g)).toBe('choose');
    checkLook(g, { candidates: [CH.mr9], pick: [CH.mr9] });
    expect(hand(g)).toEqual([CH.mr9]);
    expect(trash(g)).toEqual([ID, CH.mohji, CH.marco].sort());
  });
});

describe('EB05-045 Ms. Monday [On K.O.]: look at 3, add up to 1 Baroque Works card, trash the rest', () => {
  /** p2's Marco attacks my rested Monday (5000 vs 3000) and K.O.s her. */
  function koed(top: string[]) {
    const g = theirTurn(
      side(LD.shc, BLUE, {
        characters: [{ card: ID, rested: true }],
        deck: [...top, ...fill(BLUE, 12)],
      }),
      side(LD.shc, 'P-015', { characters: [CH.marco] }),
    );
    attack(g, g.find('p2', 'characters', CH.marco), g.find('p1', 'characters', ID));
    passBlock(g);
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    return g;
  }

  it('after a battle K.O., the Baroque Works card is added and the other two looked-at cards are TRASHED', () => {
    const g = koed([CH.mohji, CH.mr9, CH.marco]);
    checkLook(g, { candidates: [CH.mr9], pick: [CH.mr9] });
    expect(hand(g)).toEqual([CH.mr9]);
    expect(trash(g)).toEqual([ID, CH.mohji, CH.marco].sort());
    expect(deck(g)).toHaveLength(12);
  });

  it('a {Former Baroque Works} card also matches "a type including Baroque Works"', () => {
    const g = koed([CH.formerBw, CH.mohji, CH.marco]);
    checkLook(g, { candidates: [CH.formerBw], pick: [CH.formerBw] });
    expect(hand(g)).toEqual([CH.formerBw]);
  });

  it('"up to 1": adding none trashes all 3 looked-at cards', () => {
    const g = koed([CH.mr9, CH.formerBw, CH.marco]);
    checkLook(g, { candidates: [CH.mr9, CH.formerBw], pick: [] });
    expect(hand(g)).toEqual([]);
    expect(trash(g)).toEqual([ID, CH.mr9, CH.formerBw, CH.marco].sort());
  });

  it('at most 1 card is added even when two qualify', () => {
    const g = koed([CH.mr9, CH.formerBw, CH.marco]);
    checkLook(g, { candidates: [CH.mr9, CH.formerBw], pick: [CH.mr9] });
    expect(hand(g)).toEqual([CH.mr9]);
    expect(trash(g)).toEqual([ID, CH.formerBw, CH.marco].sort());
  });

  it('only 3 cards are looked at: a Baroque Works card in 4th place stays in the deck', () => {
    const g = koed([CH.mohji, CH.marco, CH.sai, CH.mr9]);
    checkLook(g, { candidates: [], pick: [] });
    expect(deck(g)[0]).toBe(CH.mr9);
    expect(trash(g)).toEqual([ID, CH.mohji, CH.marco, CH.sai].sort());
    settleYes(g, 'p1');
  });
});
