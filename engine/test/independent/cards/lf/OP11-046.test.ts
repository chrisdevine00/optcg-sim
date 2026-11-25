/**
 * OP11-046 Vinsmoke Yonji (Character, Blue, cost 4, 5000, Counter +1000, Strike, {The Vinsmoke
 * Family}/{GERMA 66}).
 *
 * Card text: "[Blocker] If you only have Characters with a type including "GERMA", this Character
 * cannot be K.O.'d or rested by your opponent's effects."
 *
 * Rules: "type including" is a substring match on any of a card's types (CR 2-4-3-1: "Kingdom of
 * GERMA" and "GERMA 66" both qualify); "only" holds when every Character I have qualifies (Yonji
 * himself does); the protection stops the opponent's K.O. and rest effects, not a K.O. in battle
 * (RL-14) and not the rest that comes with blocking (a cost of the rules, not an effect);
 * the condition is re-read each time.
 * Scenery: OP11-045 Niji ({GERMA 66}), OP06-063 Sora ({Kingdom of GERMA}), OP01-023 Marco (no
 * GERMA type); EB01-059 Kingdom Come K.O.s, OP17-038 rests (4 rested cards as its cost).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  blockers,
  chars,
  isRested,
  KINGDOM_COME,
  kind,
  LD_LF,
  need,
  noDefence,
  opponentKingdomCome,
  opponentRests,
  EV_LF,
  theirs,
  trash,
  VAN_LF,
} from './kit-lfa.ts';

const YONJI = 'OP11-046';
const { niji, sora, marco, thatch, mohji } = VAN_LF;
type Ch = string | { card: string; rested?: boolean };

/** p2's turn: p1 has Yonji plus `others`; p2 has Kingdom Come and OP17-038 in hand and a Thatch. */
function board(others: Ch[], yonji: Ch = YONJI) {
  return theirs(
    LD_LF.croc,
    { characters: [yonji, ...others] },
    {
      characters: [thatch],
      hand: [KINGDOM_COME, EV_LF.restEvent],
      life: [mohji, mohji, mohji, mohji],
      costArea: { active: 10, rested: 0 },
    },
  );
}

describe('OP11-046 Vinsmoke Yonji', () => {
  it('printed values: cost 4, 5000, Counter +1000, [Blocker]', () => {
    const g = board([]);
    const y = at(g, 'p1', 'characters', YONJI);
    expect(g.card(y).cost).toBe(4);
    expect(g.power(y)).toBe(5000);
    expect(g.card(y).counter).toBe(1000);
    expect(g.card(y).keywords).toContain('Blocker');
  });

  it('alone (only Characters with a GERMA type: himself): a K.O. effect does not K.O. him', () => {
    const g = board([]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', YONJI));
    expect(chars(g)).toEqual([YONJI]);
    expect(trash(g)).toEqual([]);
  });

  it('alone: a rest effect does not rest him', () => {
    const g = board([]);
    const y = at(g, 'p1', 'characters', YONJI);
    opponentRests(g, y);
    expect(isRested(g, y)).toBe(false);
  });

  it('with a {GERMA 66} Character as well, both protections hold', () => {
    const g = board([niji]);
    const y = at(g, 'p1', 'characters', YONJI);
    opponentRests(g, y);
    expect(isRested(g, y)).toBe(false);
    const h = board([niji]);
    opponentKingdomCome(h, at(h, 'p1', 'characters', YONJI));
    expect(chars(h)).toEqual([YONJI, niji].sort());
  });

  it('"type including": a {Kingdom of GERMA} Character keeps the condition true', () => {
    const g = board([sora]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', YONJI));
    expect(chars(g)).toEqual([YONJI, sora].sort());
  });

  it("a Character without a GERMA type breaks the condition: he is K.O.'d", () => {
    const g = board([marco]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', YONJI));
    expect(chars(g)).toEqual([marco]);
    expect(trash(g)).toEqual([YONJI]);
  });

  it('a Character without a GERMA type breaks the condition: he is rested', () => {
    const g = board([marco, niji]);
    const y = at(g, 'p1', 'characters', YONJI);
    expect(opponentRests(g, y)).toBe(true);
    expect(isRested(g, y)).toBe(true);
  });

  it('the condition is read when the effect resolves: once the other Character is gone he is protected again', () => {
    const g = board([{ card: marco, rested: true }]);
    attack(g, at(g, 'p2', 'characters', thatch), at(g, 'p1', 'characters', marco));
    noDefence(g);
    expect(chars(g)).toEqual([YONJI]);
    need(g, 'main', 'p2');
    const y = at(g, 'p1', 'characters', YONJI);
    opponentRests(g, y);
    expect(isRested(g, y)).toBe(false);
  });

  it('only effects are stopped: a rested Yonji alone still loses a battle', () => {
    const g = board([], { card: YONJI, rested: true });
    attack(g, at(g, 'p2', 'characters', thatch), at(g, 'p1', 'characters', YONJI));
    noDefence(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([YONJI]);
  });

  it('[Blocker] still works: he can block (the rest of blocking is not an effect) and is rested by it', () => {
    const g = board([]);
    const y = at(g, 'p1', 'characters', YONJI);
    attack(g, at(g, 'p2', 'characters', thatch), g.leader('p1'));
    expect(blockers(g)).toEqual([y]);
    act(g, { type: 'block', blocker: y });
    expect(isRested(g, y)).toBe(true);
    noDefence(g);
    expect(kind(g)).toBe('main');
  });

  it("my other Characters get no protection from him: a non-GERMA Character is K.O.'d as usual", () => {
    const g = board([marco, niji]);
    opponentKingdomCome(g, at(g, 'p1', 'characters', niji));
    expect(chars(g)).toEqual([YONJI, marco].sort());
    expect(trash(g)).toEqual([niji]);
  });
});
