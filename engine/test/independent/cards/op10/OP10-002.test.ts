/**
 * OP10-002 Caesar Clown (Leader, Blue/Red, 5000, 4 Life, {Punk Hazard}/{Scientist}).
 *
 * Card text: "[DON!! x2] [When Attacking] You may return 1 of your {Punk Hazard} type Characters
 * with a cost of 2 or more to the owner's hand: K.O. up to 1 of your opponent's Characters with
 * 4000 power or less."
 *
 * Rules: [DON!! x2] is a state check (RL-13): two DON!! must be given to the Leader. The cost is a
 * "you may" cost: the effect runs only if the Character is returned (CR 8-3-1-3: an unpayable cost
 * cannot be paid at all). "Up to 1" may be 0. The cost filter reads the cost as it is on the field.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  canUse,
  choices,
  kind,
  mine,
  need,
  no,
  offeredIds,
  pickInst,
  skipPick,
  unusable,
  V10,
  VAN,
  yes,
  cardIds,
  type Chars,
} from './kit-op10a.ts';

const CAESAR = 'OP10-002';
/** OP10-004 Vergo: Red, cost 1, 2000, {Punk Hazard}. [On Play] only (inert on the field). */
const VERGO1 = 'OP10-004';
/** OP10-017 Rock: Red, cost 2, 3000, {Punk Hazard}. [On Play] only (inert on the field). */
const ROCK2 = 'OP10-017';

function board(mineChars: Chars, theirChars: Chars, leaderDon = 2) {
  return mine(
    { card: CAESAR, don: leaderDon },
    { costArea: { active: 10 - leaderDon, rested: 0 }, characters: mineChars },
    { characters: theirChars },
  );
}

function swing(g: ReturnType<typeof board>): void {
  attack(g, g.leader('p1'), g.leader('p2'));
}

describe('OP10-002 Caesar Clown: [DON!! x2] [When Attacking] return a {Punk Hazard} Character: K.O. 4000 or less', () => {
  it('printed values: 5000 power, 4 Life', () => {
    const g = board([], []);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('with 2 DON!! given: the attack asks; paying returns the Character to hand and K.O.s a 4000 Character', () => {
    const g = board([V10.mochaPh4], [VAN.sai]);
    swing(g);
    yes(g, 'p1');
    // The only candidate pays the cost on its own (no question), then the target is asked.
    expect(offeredIds(g)).toEqual([VAN.sai]);
    pickInst(g, [at(g, 'p2', 'characters', VAN.sai)]);
    expect(cardIds(g, 'p1', 'hand')).toContain(V10.mochaPh4);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(cardIds(g, 'p2', 'trash')).toEqual([VAN.sai]);
    expect(kind(g)).toBe('block');
  });

  it('boundary: 4000 power is a legal target, 5000 is not offered', () => {
    const g = board([V10.mochaPh4], [VAN.sai, VAN.marco]);
    swing(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.sai]);
  });

  it('power is read as it is on my turn: an opposing 4000 Character with a DON!! given still has 4000 and is a target', () => {
    const g = board([V10.mochaPh4], [{ card: VAN.sai, don: 1 }]);
    expect(g.power(at(g, 'p2', 'characters', VAN.sai))).toBe(4000);
    swing(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.sai]);
  });

  it("only the opponent's Characters can be K.O.'d, never my own", () => {
    const g = board([V10.mochaPh4, VAN.sai], [VAN.komachiyo]);
    swing(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([VAN.komachiyo]);
  });

  it('boundary: a cost-2 {Punk Hazard} Character may be returned', () => {
    const g = board([ROCK2], [VAN.sai]);
    swing(g);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', VAN.sai)]);
    expect(cardIds(g, 'p1', 'hand')).toContain(ROCK2);
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
  });

  it('boundary: a cost-1 {Punk Hazard} Character cannot pay the cost: the effect is not usable', () => {
    const g = board([VERGO1], [VAN.sai]);
    swing(g);
    unusable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(cardIds(g, 'p1', 'characters')).toEqual([VERGO1]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.sai]);
  });

  it('a Character that is not {Punk Hazard} cannot pay the cost', () => {
    const g = board([VAN.marco, V10.tashigiNavy], [VAN.sai]);
    swing(g);
    unusable(g, 'p1');
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.sai]);
    expect(cardIds(g, 'p1', 'hand')).not.toContain(VAN.marco);
  });

  it('only the {Punk Hazard} Characters with cost 2+ are offered as the cost', () => {
    const g = board([VERGO1, ROCK2, V10.mochaPh4, VAN.marco], [VAN.sai]);
    swing(g);
    yes(g, 'p1');
    const d = need(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    expect(offeredIds(g)).toEqual([ROCK2, V10.mochaPh4].sort());
  });

  it("declining the cost: nothing is returned and nothing is K.O.'d", () => {
    const g = board([V10.mochaPh4], [VAN.sai]);
    swing(g);
    no(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([V10.mochaPh4]);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.sai]);
    expect(kind(g)).toBe('block');
  });

  it('"up to 1": after paying the cost the K.O. may be skipped (the Character stays returned)', () => {
    const g = board([V10.mochaPh4], [VAN.sai]);
    swing(g);
    yes(g, 'p1');
    skipPick(g);
    expect(cardIds(g, 'p1', 'hand')).toContain(V10.mochaPh4);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.sai]);
  });

  it("no target with 4000 power or less: the cost may still be paid, nothing is K.O.'d", () => {
    const g = board([V10.mochaPh4], [VAN.marco]);
    swing(g);
    yes(g, 'p1');
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      skipPick(g);
    }
    expect(cardIds(g, 'p1', 'hand')).toContain(V10.mochaPh4);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.marco]);
  });

  it('must not happen: with only 1 DON!! given the attack does not ask', () => {
    const g = board([V10.mochaPh4], [VAN.sai], 1);
    swing(g);
    expect(kind(g)).toBe('block');
    expect(canUse(g)).toBe(false);
    expect(cardIds(g, 'p2', 'characters')).toEqual([VAN.sai]);
  });

  it('must not happen: with no DON!! given the attack does not ask', () => {
    const g = board([V10.mochaPh4], [VAN.sai], 0);
    swing(g);
    expect(kind(g)).toBe('block');
    expect(cardIds(g, 'p1', 'characters')).toEqual([V10.mochaPh4]);
  });

  it('the Punk Hazard Character that attacks is not required: a Character attack does not trigger the Leader', () => {
    const g = board([V10.mochaPh4], [VAN.sai]);
    attack(g, at(g, 'p1', 'characters', V10.mochaPh4), g.leader('p2'));
    expect(kind(g)).toBe('block');
  });
});
