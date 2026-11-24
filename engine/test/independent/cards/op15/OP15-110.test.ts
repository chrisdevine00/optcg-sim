/**
 * OP15-110 Braham (Character, Yellow, cost 3, 4000, Counter +2000, {Sky Island}/{Shandian Warrior}).
 *
 * Card text: "[On K.O.] If your Leader has the {Shandian Warrior} type, add up to 1 card from the top of your
 * deck to the top of your Life cards."
 *
 * Rules relied on: RD 122 (a failed condition gates the effect), RL-15 (K.O. is battle or effect; a return
 * to hand is not a K.O.), "up to" may choose nothing, the card added goes on TOP of Life.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  battleKo,
  BLUE,
  bounceEffect,
  deck,
  deckTop,
  hand,
  kind,
  koEffect,
  LD15,
  lifeCards,
  need,
  result,
  no,
  SC15,
  theirsWith,
  trash,
  yes,
} from './kit-op15c.ts';

const BRAHAM = 'OP15-110';
const TOP = SC15.red4;

function board(leader: string, deckCards: string[] = deckTop([TOP, SC15.red5])) {
  return theirsWith(leader, { characters: [{ card: BRAHAM, rested: true }], deck: deckCards });
}

/** Answer the "add up to 1 card from the top of your deck" step with yes, whichever way it is asked. */
function addIt(g: ReturnType<typeof board>) {
  need(g, 'optional', 'p1');
  yes(g, 'p1');
}

describe('OP15-110 Braham [On K.O.]', () => {
  it('{Shandian Warrior} Leader, K.O.’d in battle: the top card of the deck goes on top of Life', () => {
    const g = board(LD15.shandian);
    battleKo(g, at(g, 'p1', 'characters', BRAHAM));
    addIt(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(g.life('p1')).toBe(5);
    expect(lifeCards(g)[0]).toBe(TOP);
    expect(deck(g)[0]).toBe(SC15.red5);
    expect(deck(g)).toHaveLength(11);
    expect(trash(g)).toEqual([BRAHAM]);
  });

  it('K.O.’d by the opponent’s effect also counts', () => {
    const g = board(LD15.shandian);
    koEffect(g, at(g, 'p1', 'characters', BRAHAM));
    addIt(g);
    expect(g.life('p1')).toBe(5);
    expect(lifeCards(g)[0]).toBe(TOP);
  });

  it('a {Sky Island} Leader that is not {Shandian Warrior} (Enel): the condition fails, Life is unchanged', () => {
    const g = board(LD15.sky);
    battleKo(g, at(g, 'p1', 'characters', BRAHAM));
    expect(kind(g)).not.toBe('optional');
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(12);
  });

  it('a Leader without either type: Life is unchanged', () => {
    const g = board(LD15.neutral);
    battleKo(g, at(g, 'p1', 'characters', BRAHAM));
    expect(g.life('p1')).toBe(4);
  });

  it('"up to 1": declining adds nothing', () => {
    const g = board(LD15.shandian);
    battleKo(g, at(g, 'p1', 'characters', BRAHAM));
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(12);
  });

  it('adds exactly 1 card, face-down on top of the existing Life cards', () => {
    const g = board(LD15.shandian);
    battleKo(g, at(g, 'p1', 'characters', BRAHAM));
    addIt(g);
    expect(lifeCards(g)).toEqual([TOP, BLUE, BLUE, BLUE, BLUE]);
  });

  it('returned to hand by an effect is not a K.O.: no Life is added', () => {
    const g = board(LD15.shandian);
    bounceEffect(g, at(g, 'p1', 'characters', BRAHAM));
    expect(kind(g)).not.toBe('optional');
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([BRAHAM]);
  });

  it('with exactly 1 card in the deck, adding it empties the deck: p1 loses by deck-out (CR 9-2-1-2)', () => {
    const g = board(LD15.shandian, [TOP]);
    battleKo(g, at(g, 'p1', 'characters', BRAHAM));
    addIt(g);
    expect(result(g)).toEqual({ winner: 'p2', reason: 'deck out' });
  });
});
