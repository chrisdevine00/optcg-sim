/**
 * OP10-036 Perona (Character, Blue, cost 4, 5000, Counter +1000, {Thriller Bark Pirates}/{ODYSSEY}/{Muggy Kingdom}).
 *
 * Card text: "[Your Turn] [Once Per Turn] If a Character is rested by your effect, set up to 1 of your
 * DON!! cards as active."
 *
 * The rest effect used is EB05-012 Camie ([On Play] Rest up to 1 of your opponent's Characters with a
 * cost of 6 or less).
 *
 * Rules: CR 8-1-1 (an effect), "[Your Turn]" is the owner's turn only, "[Once Per Turn]" (CR 10-2-13),
 * "up to" may be skipped (CR 8-1-2), "set up to N DON!! as active" asks a count (E-Q11).
 * Open reading (M6b-Q41, Q30): whether a rest paid as a cost, or by an attack, counts as "rested by your
 * effect". Tests use a rest by an effect (every reading) and an attack (no reading counts it).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, endTurn, noDefence } from '../../helpers.ts';
import {
  answerCount,
  C10,
  countIds,
  donSum,
  doneRaw,
  expectMain,
  inst,
  L10,
  mine,
  need,
  offeredInsts,
  pickRaw,
  playRaw,
  rested,
  theirs,
  X10,
} from './kit-op10b.ts';

const PERONA = 'OP10-036';

/** p1: Perona on the field, Camie(s) in hand; 3 rested DON!! after one Camie; the opponent holds `p2chars`. */
function board(
  p2chars: (string | { card: string; rested: boolean })[] = [C10.marco],
  camies = 1,
  costArea = { active: 4, rested: 0 },
) {
  return mine(
    L10.luffy,
    {
      hand: Array.from({ length: camies }, () => X10.camie),
      characters: [PERONA],
      costArea,
    },
    { characters: p2chars },
  );
}

describe('OP10-036 Perona: [Your Turn] [Once Per Turn] a Character rested by my effect sets 1 DON!! active', () => {
  it('an opposing Character rested by my effect: asks how many DON!! (1 or 0) and sets 1 rested DON!! active', () => {
    const g = board();
    playRaw(g, X10.camie);
    pickRaw(g, inst(g, 'p2', 'characters', C10.marco));
    expect(rested(g, inst(g, 'p2', 'characters', C10.marco))).toBe(true);
    expect(countIds(g)).toEqual(['1', '0']);
    expect(donSum(g)).toMatchObject({ active: 1, rested: 3 });
    answerCount(g, 1);
    expectMain(g);
    expect(donSum(g)).toMatchObject({ active: 2, rested: 2 });
  });

  it('"up to 1": may set none, and the DON!! stay rested', () => {
    const g = board();
    playRaw(g, X10.camie);
    pickRaw(g, inst(g, 'p2', 'characters', C10.marco));
    answerCount(g, 0);
    expectMain(g);
    expect(donSum(g)).toMatchObject({ active: 1, rested: 3 });
  });

  it('sets only 1 DON!! even with several rested', () => {
    const g = board([C10.marco], 1, { active: 6, rested: 3 });
    playRaw(g, X10.camie);
    pickRaw(g, inst(g, 'p2', 'characters', C10.marco));
    expect(countIds(g)).not.toContain('2');
    answerCount(g, 1);
    expect(donSum(g)).toMatchObject({ active: 4, rested: 5 });
  });

  it('[Once Per Turn]: a second Character rested by my effect in the same turn sets no DON!!', () => {
    const g = board([C10.marco, C10.mohji], 2, { active: 6, rested: 0 });
    playRaw(g, X10.camie);
    pickRaw(g, inst(g, 'p2', 'characters', C10.marco));
    answerCount(g, 1);
    expectMain(g);
    const after = donSum(g);
    expect(after).toMatchObject({ active: 4, rested: 2 });
    playRaw(g, X10.camie);
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(rested(g, inst(g, 'p2', 'characters', C10.mohji))).toBe(true);
    expectMain(g);
    expect(donSum(g)).toMatchObject({ active: 1, rested: 5 });
  });

  it('the rest effect resting nothing ("up to 1" chosen as none) sets no DON!!', () => {
    const g = board();
    playRaw(g, X10.camie);
    need(g, 'choose', 'p1');
    doneRaw(g);
    expectMain(g);
    expect(donSum(g)).toMatchObject({ active: 1, rested: 3 });
    expect(rested(g, inst(g, 'p2', 'characters', C10.marco))).toBe(false);
  });

  it('with no Perona on the field, the same rest sets no DON!! active', () => {
    const g = mine(
      L10.luffy,
      { hand: [X10.camie], characters: [C10.mohji], costArea: { active: 4, rested: 0 } },
      { characters: [C10.marco] },
    );
    playRaw(g, X10.camie);
    pickRaw(g, inst(g, 'p2', 'characters', C10.marco));
    expectMain(g);
    expect(donSum(g)).toMatchObject({ active: 1, rested: 3 });
  });

  it('only a rest by an effect counts: my Character resting to attack sets no DON!! active', () => {
    const g = mine(
      L10.luffy,
      { characters: [PERONA, C10.marco], costArea: { active: 5, rested: 3 } },
      {},
    );
    attack(g, inst(g, 'p1', 'characters', C10.marco), g.leader('p2'));
    noDefence(g);
    expect(rested(g, inst(g, 'p1', 'characters', C10.marco))).toBe(true);
    expectMain(g);
    expect(donSum(g)).toMatchObject({ active: 5, rested: 3 });
  });

  it("[Your Turn]: my Character rested by the opponent's effect on their turn sets no DON!!", () => {
    const g = theirs(
      L10.luffy,
      { characters: [PERONA, C10.marco], costArea: { active: 1, rested: 3 } },
      { hand: [X10.camie], costArea: { active: 10, rested: 0 } },
    );
    playRaw(g, X10.camie);
    pickRaw(g, inst(g, 'p1', 'characters', C10.marco));
    expect(rested(g, inst(g, 'p1', 'characters', C10.marco))).toBe(true);
    expectMain(g, 'p2');
    expect(donSum(g, 'p1')).toMatchObject({ active: 1, rested: 3 });
  });

  it('[Once Per Turn] renews on my next turn', () => {
    const g = board([C10.marco, C10.mohji], 2, { active: 6, rested: 0 });
    playRaw(g, X10.camie);
    pickRaw(g, inst(g, 'p2', 'characters', C10.marco));
    answerCount(g, 1);
    endTurn(g);
    need(g, 'main', 'p2');
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    // p1's second Camie is still in hand; a new turn, a new use
    const before = donSum(g);
    playRaw(g, X10.camie);
    pickRaw(g, inst(g, 'p2', 'characters', C10.mohji));
    expect(offeredInsts(g)).toEqual([]);
    expect(countIds(g)).toEqual(['1', '0']);
    answerCount(g, 1);
    expect(donSum(g).active).toBe(before.active - 3 + 1);
  });
});
