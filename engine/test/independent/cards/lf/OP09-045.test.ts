/**
 * OP09-045 Cabaji (Character, Blue, cost 5, 5000, Counter +2000, Slash, {Cross Guild}).
 *
 * Card text: "If you have a [Buggy] or [Mohji] Character, this Character cannot be K.O.'d in battle."
 *
 * Rules: a permanent effect valid while its condition holds (CR 8-1-3-3, 8-2-1-2); [Buggy] and
 * [Mohji] are card names (an exact match: "Mohji & Cabaji" is another name); "you have" means my
 * own field; "cannot be K.O.'d in battle" does not stop a K.O. by an effect (RL-14); a Character
 * that loses a battle but cannot be K.O.'d simply stays.
 * Scenery: OP02-060 Mohji, ST03-011 Buggy, OP12-055 Mohji & Cabaji (all vanilla Blue).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  endTurn,
  hand,
  KINGDOM_COME,
  kind,
  LD_LF,
  need,
  noDefence,
  opponentKingdomCome,
  theirs,
  trash,
  VAN_LF,
} from './kit-lfa.ts';

const CABAJI = 'OP09-045';
const { marco, thatch, mohji, buggy, mohjiCabaji } = VAN_LF;
type Ch = string | { card: string; rested: boolean };
const rest = (card: string): Ch => ({ card, rested: true });

/** p2's turn: p1 has a rested Cabaji plus `others`; p2 has two Thatch (8000) and Kingdom Come. */
function board(others: Ch[], p2chars: Ch[] = [thatch, thatch]) {
  return theirs(
    LD_LF.croc,
    { characters: [rest(CABAJI), ...others] },
    {
      characters: p2chars,
      hand: [KINGDOM_COME],
      life: [mohji, mohji, mohji, mohji],
    },
  );
}

/** p2's first Thatch attacks Cabaji; nobody defends. */
function hitCabaji(g: ReturnType<typeof board>) {
  attack(g, at(g, 'p2', 'characters', thatch, 0), at(g, 'p1', 'characters', CABAJI));
  noDefence(g);
}

describe('OP09-045 Cabaji', () => {
  it('printed values: cost 5, 5000 power, Counter +2000', () => {
    const g = board([]);
    const c = at(g, 'p1', 'characters', CABAJI);
    expect(g.card(c).cost).toBe(5);
    expect(g.power(c)).toBe(5000);
    expect(g.card(c).counter).toBe(2000);
  });

  it('with a [Mohji] Character, losing a battle does not K.O. him', () => {
    const g = board([mohji]);
    hitCabaji(g);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([CABAJI, mohji].sort());
    expect(trash(g)).toEqual([]);
  });

  it('with a [Buggy] Character it is the same', () => {
    const g = board([buggy]);
    hitCabaji(g);
    expect(chars(g)).toEqual([CABAJI, buggy].sort());
  });

  it('a rested [Mohji] counts as well', () => {
    const g = board([rest(mohji)]);
    hitCabaji(g);
    expect(chars(g)).toContain(CABAJI);
  });

  it("without [Buggy] or [Mohji] he is K.O.'d in battle", () => {
    const g = board([marco]);
    hitCabaji(g);
    expect(chars(g)).toEqual([marco]);
    expect(trash(g)).toEqual([CABAJI]);
  });

  it('a card named [Mohji & Cabaji] is not [Mohji]', () => {
    const g = board([mohjiCabaji]);
    hitCabaji(g);
    expect(chars(g)).toEqual([mohjiCabaji]);
    expect(trash(g)).toEqual([CABAJI]);
  });

  it('[Mohji] in my hand is not a Character I have', () => {
    const g = theirs(
      LD_LF.croc,
      { characters: [rest(CABAJI)], hand: [mohji, buggy] },
      { characters: [thatch] },
    );
    hitCabaji(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([CABAJI]);
    expect(hand(g)).toEqual([buggy, mohji].sort());
  });

  it('the opponent\'s [Mohji] does not count: "you have" means my field', () => {
    const g = board([marco], [thatch, mohji]);
    hitCabaji(g);
    expect(chars(g)).toEqual([marco]);
    expect(trash(g)).toEqual([CABAJI]);
  });

  it("the condition is read when the battle resolves: after [Mohji] is K.O.'d the next attack K.O.s Cabaji", () => {
    const g = board([rest(mohji)]);
    attack(g, at(g, 'p2', 'characters', thatch, 0), at(g, 'p1', 'characters', mohji));
    noDefence(g);
    expect(chars(g)).toEqual([CABAJI]);
    attack(g, at(g, 'p2', 'characters', thatch, 1), at(g, 'p1', 'characters', CABAJI));
    noDefence(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g).sort()).toEqual([CABAJI, mohji].sort());
  });

  it("only battle is covered: with [Mohji] on the field an opponent's K.O. effect still K.O.s Cabaji", () => {
    const g = board([mohji]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', CABAJI));
    expect(chars(g)).toEqual([mohji]);
    expect(trash(g)).toEqual([CABAJI]);
  });

  it('must not: the protected battle changes no Life total and the game goes on', () => {
    const g = board([mohji]);
    hitCabaji(g);
    expect(g.life('p1')).toBe(4);
    expect(g.life('p2')).toBe(4);
    endTurn(g);
    need(g, 'main', 'p1');
  });
});
