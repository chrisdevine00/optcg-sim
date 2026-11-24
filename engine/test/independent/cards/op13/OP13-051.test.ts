/**
 * OP13-051 Boa Hancock (Character, Blue, cost 3, 5000, no Counter, {Kuja Pirates}/{The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[On K.O.] If your Leader is [Boa Hancock] or multicolored, draw 2 cards."
 *
 * Rules: digest 109 (trash is not a K.O.), RL-26 (deck-out), CR 8-1-2 (mandatory). The condition
 * is read on my Leader when the K.O. resolves.
 */
import { describe, expect, it } from 'vitest';
import {
  attack,
  BLUE,
  handOf,
  isMain,
  mine,
  need,
  noDefence,
  opponentKOs,
  pickInst,
  playRaw,
  result,
  SC2,
  theirs,
  WL,
  WV,
} from './kit-op13b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const HANCOCK = 'OP13-051';

/** p2's turn: p1's rested Hancock is K.O.'d in battle by Thatch. */
function koInBattle(
  leader: string,
  deck: string[] = [WV.marco, WV.sai, BLUE, BLUE, BLUE],
): TestGame {
  const g = theirs(
    leader,
    { characters: [{ card: HANCOCK, rested: true }], deck },
    { characters: [WV.thatch] },
  );
  attack(g, g.find('p2', 'characters', WV.thatch), g.find('p1', 'characters', HANCOCK));
  noDefence(g);
  return g;
}

describe('OP13-051 Boa Hancock: [On K.O.] with a [Boa Hancock] or multicoloured Leader, draw 2', () => {
  it('[Boa Hancock] Leader: draws the top 2 cards', () => {
    const g = koInBattle(WL.hancock);
    expect(handOf(g)).toEqual([WV.marco, WV.sai].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(3);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('multicoloured Leader that is not [Boa Hancock] (Law, green/red): draws 2', () => {
    const g = koInBattle(WL.law);
    expect(handOf(g)).toHaveLength(2);
  });

  it('the multicoloured [Boa Hancock] Leader (OP14-041) satisfies both: draws 2, not 4', () => {
    const g = koInBattle(WL.hancockMulti);
    expect(handOf(g)).toHaveLength(2);
  });

  it('a single-colour Leader that is not [Boa Hancock] (Crocodile): draws nothing', () => {
    const g = koInBattle(WL.croc);
    expect(handOf(g)).toEqual([]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([HANCOCK]);
  });

  it('K.O.d by an opponent effect also triggers it', () => {
    const g = theirs(
      WL.hancock,
      { characters: [HANCOCK], deck: [WV.marco, WV.sai, BLUE, BLUE] },
      { hand: [SC2.lightning] },
    );
    opponentKOs(g, g.find('p1', 'characters', HANCOCK));
    expect(handOf(g)).toEqual([WV.marco, WV.sai].sort());
  });

  it('must not happen: trashed for the 5-Character limit (not a K.O.) draws nothing', () => {
    const g = mine(WL.hancock, {
      hand: [WV.mohji],
      characters: [HANCOCK, WV.marco, WV.sai, WV.jil, WV.kingdew],
    });
    playRaw(g, WV.mohji);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', HANCOCK)]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([HANCOCK]);
    expect(handOf(g)).toEqual([]);
  });

  it('nothing triggers when Hancock is played (no [On Play])', () => {
    const g = mine(WL.hancock, { hand: [HANCOCK] });
    playRaw(g, HANCOCK);
    expect(isMain(g)).toBe(true);
    expect(handOf(g)).toEqual([]);
  });

  it('mandatory: no prompt is asked for the draw', () => {
    const g = koInBattle(WL.hancock);
    need(g, 'main', 'p2');
  });

  it('deck-out: with 2 cards in the deck, drawing them empties it and I lose; with 3 I keep playing', () => {
    const lose = koInBattle(WL.hancock, [BLUE, BLUE]);
    expect(result(lose)).toMatchObject({ winner: 'p2' });
    const keep = koInBattle(WL.hancock, [BLUE, BLUE, BLUE]);
    expect(result(keep)).toBeNull();
  });
});
