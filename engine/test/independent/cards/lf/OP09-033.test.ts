/**
 * OP09-033 Nico Robin (Character, Green, cost 4, 5000, Counter +1000, Strike, {Straw Hat Crew}/{ODYSSEY}).
 *
 * Card text: "[On Play] If you have 2 or more rested Characters, none of your "ODYSSEY" or "Straw Hat
 * Crew" type Characters can be K.O.'d by effects until the end of your opponent's next turn."
 *
 * Rules: the [On Play] is mandatory and needs no choice; "If" is an effect condition read when the
 * effect resolves; "rested Characters" are my own; the protection stops K.O. by effects only
 * (RL-14); "until the end of your opponent's next turn" covers the opponent's whole next turn and
 * no later one (RL-11). The data prints the types in quotes, which the card data treats as exact
 * types (DECISIONS 2026-11-25, block 3 batch B).
 * Scenery: ST01-008-like vanilla cards are avoided; OP09-038 Lucci is {ODYSSEY}, OP02-039 Franky is
 * {Straw Hat Crew}, OP01-023 Marco and OP01-012 Sai are neither.
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  at,
  attack,
  chars,
  endTurn,
  hand,
  kind,
  koWithKingdomCome,
  KINGDOM_COME,
  LD_LF,
  mine,
  need,
  noDefence,
  opponentKingdomCome,
  playRaw,
  trash,
  yes,
  VAN_LF,
} from './kit-lfa.ts';

const ROBIN = 'OP09-033';
const { marco, sai, lucci, frankyShc, thatch, mohji } = VAN_LF;
type Ch = string | { card: string; rested: boolean };
const rest = (card: string): Ch => ({ card, rested: true });

/** p1 plays Robin with `mineChars` on the field; p2 holds Kingdom Come and a Thatch. */
function play(mineChars: Ch[], p2: { characters?: Ch[] } = {}) {
  const g = mine(
    LD_LF.luffy,
    { hand: [ROBIN], characters: mineChars, costArea: { active: 10, rested: 0 } },
    {
      hand: [KINGDOM_COME],
      characters: p2.characters ?? [thatch],
      life: [mohji, mohji, mohji, mohji],
      costArea: { active: 10, rested: 0 },
    },
  );
  playRaw(g, ROBIN);
  return g;
}

/** After Robin: end my turn and let p2 (turn 4) K.O. `target` with Kingdom Come. */
function theyKo(g: TestGame, target: string) {
  endTurn(g);
  need(g, 'main', 'p2');
  opponentKingdomCome(g, at(g, 'p1', 'characters', target));
}

describe('OP09-033 Nico Robin', () => {
  it('printed values: cost 4, 5000 power, Counter +1000; the [On Play] asks nothing', () => {
    const g = play([rest(marco), rest(sai)]);
    expect(kind(g)).toBe('main');
    const r = at(g, 'p1', 'characters', ROBIN);
    expect(g.card(r).cost).toBe(4);
    expect(g.power(r)).toBe(5000);
    expect(g.card(r).counter).toBe(1000);
  });

  it("2 rested Characters: my {ODYSSEY} Character cannot be K.O.'d by the opponent's effects", () => {
    const g = play([rest(marco), rest(sai), lucci]);
    theyKo(g, lucci);
    expect(chars(g)).toContain(lucci);
    expect(trash(g)).not.toContain(lucci);
  });

  it('2 rested Characters: my {Straw Hat Crew} Character is protected too, and so is Robin herself', () => {
    const g = play([rest(marco), rest(sai), frankyShc]);
    theyKo(g, frankyShc);
    expect(chars(g)).toContain(frankyShc);
    const h = play([rest(marco), rest(sai)]);
    theyKo(h, ROBIN);
    expect(chars(h)).toContain(ROBIN);
  });

  it('a Character of another type is not protected', () => {
    const g = play([rest(marco), rest(sai), lucci]);
    theyKo(g, marco);
    expect(chars(g)).not.toContain(marco);
    expect(trash(g)).toContain(marco);
    expect(chars(g)).toContain(lucci);
  });

  it('boundary: only 1 rested Character is not enough; the same K.O. works', () => {
    const g = play([rest(marco), lucci]);
    theyKo(g, lucci);
    expect(chars(g)).not.toContain(lucci);
    expect(trash(g)).toContain(lucci);
  });

  it('boundary: active Characters do not count (1 rested + 1 active other than Robin)', () => {
    const g = play([rest(marco), sai, lucci]);
    theyKo(g, lucci);
    expect(trash(g)).toContain(lucci);
  });

  it("the opponent's rested Characters do not count as mine", () => {
    const g = play([rest(marco), lucci], {
      characters: [rest(thatch), rest(thatch), rest(thatch)],
    });
    theyKo(g, lucci);
    expect(trash(g)).toContain(lucci);
  });

  it('3 rested Characters are enough as well', () => {
    const g = play([rest(marco), rest(sai), rest(VAN_LF.wire), lucci]);
    theyKo(g, lucci);
    expect(chars(g)).toContain(lucci);
  });

  it('only K.O. by effects is stopped: a battle K.O. of a protected rested Character still happens', () => {
    const g = play([rest(marco), rest(sai), rest(lucci)]);
    endTurn(g);
    need(g, 'main', 'p2');
    attack(g, at(g, 'p2', 'characters', thatch), at(g, 'p1', 'characters', lucci));
    noDefence(g);
    expect(chars(g)).not.toContain(lucci);
    expect(trash(g)).toContain(lucci);
  });

  it("the protection ends with the opponent's next turn: on their turn after that the K.O. works", () => {
    const g = play([rest(marco), rest(sai), lucci]);
    endTurn(g); // p2 turn 4: protected, p2 does nothing
    need(g, 'main', 'p2');
    endTurn(g); // p1 turn 5
    need(g, 'main', 'p1');
    endTurn(g); // p2 turn 6
    need(g, 'main', 'p2');
    opponentKingdomCome(g, at(g, 'p1', 'characters', lucci));
    expect(chars(g)).not.toContain(lucci);
    expect(trash(g)).toContain(lucci);
  });

  it("must not protect the opponent's Characters: my own K.O. effect still K.O.s their {Straw Hat Crew} Character", () => {
    const g = mine(
      LD_LF.luffy,
      { hand: [ROBIN, KINGDOM_COME], characters: [rest(marco), rest(sai)] },
      { characters: [frankyShc], life: [mohji, mohji, mohji, mohji] },
    );
    playRaw(g, ROBIN);
    koWithKingdomCome(g, at(g, 'p2', 'characters', frankyShc));
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('with the condition failing, my played Robin is a plain 5000 Character and nothing is left pending', () => {
    const g = play([]);
    expect(kind(g)).toBe('main');
    expect(chars(g)).toEqual([ROBIN]);
    expect(hand(g)).toEqual([]);
  });
});

void yes;
