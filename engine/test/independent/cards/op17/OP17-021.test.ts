/**
 * OP17-021 Crone Oil (Character, Green, cost 1, 0, Counter +2000, {Red-Haired Pirates Allies}, Slash).
 *
 * Card text: "If your Character with a type including "Red-Haired Pirates" would be removed from the
 * field by your opponent's effect, you may rest 1 of your cards instead."
 *
 * Rules: CR 8-1-3-4 (replacement effects), RL-31 (QA-OP17 OP17-021: two Characters would leave at once,
 * you rest 1 card and neither leaves; an impossible replacement cannot be applied), "a type
 * including", E-Q3 / M4b-1 ("cards" includes DON!!). Scenery: OP09-077 Gum-Gum Lightning and OP12-038
 * Two-Sword Style Rashomon (the opponent's K.O. effects); no scripted card removes in another way.
 */
import { describe, expect, it } from 'vitest';
import { fill } from '../../helpers.ts';
import {
  accept,
  attack,
  BLUE,
  charsOf,
  choices,
  choose,
  decider,
  decision,
  decline,
  don,
  donChoices,
  expectMain,
  isRested,
  kind,
  LD,
  noDefence,
  opponentKOs,
  payDon,
  playCard,
  SC2,
  side,
  theirTurn,
  RED,
  trash,
  WB,
} from './kit-op17a.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const CRONE = 'OP17-021';
const ROCKSTAR = SC2.rockstar; // OP09-016, cost 4, 6000, {Red-Haired Pirates}

function board(
  own: (string | { card: string; rested: boolean })[],
  p1: {
    costArea?: { active: number; rested: number };
    leader?: string | { card: string; rested: boolean };
  } = {},
) {
  return theirTurn(
    {
      ...side(LD.luffy, BLUE, {
        characters: own,
        life: fill(BLUE, 4),
        costArea: p1.costArea ?? { active: 3, rested: 0 },
      }),
      leader: p1.leader ?? LD.luffy,
    },
    side(LD.luffy, RED, {
      hand: [SC2.lightning, SC2.rashomon],
      characters: [WB.kingdew],
      costArea: { active: 10, rested: 0 },
    }),
  );
}
const ko = (g: TestGame, target: string) => opponentKOs(g, g.find('p1', 'characters', target));

describe('OP17-021 Crone Oil: replacement, rest 1 of your cards instead of a Red-Haired Pirates Character removed by the opponent’s effect', () => {
  it('the replacement is offered when the opponent’s effect would K.O. my {Red-Haired Pirates} Character', () => {
    const g = board([CRONE, ROCKSTAR]);
    ko(g, ROCKSTAR);
    expect(decider(g)).toBe('p1');
    expect(kind(g)).toBe('optional');
    expect(decision(g)?.purpose).toBe('replacement');
  });

  it('accepting and resting 1 of my cards (a DON!!) keeps the Character on the field', () => {
    const g = board([CRONE, ROCKSTAR]);
    ko(g, ROCKSTAR);
    accept(g);
    payDon(g, 1);
    expect(charsOf(g, 'p1')).toEqual([CRONE, ROCKSTAR].sort());
    expect(trash(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 2, rested: 1 });
  });

  it('"1 of your cards" includes my Characters and Leader: they are offered along with DON!!', () => {
    const g = board([CRONE, ROCKSTAR]);
    ko(g, ROCKSTAR);
    accept(g);
    expect(donChoices(g).length).toBeGreaterThan(0);
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).toContain(g.find('p1', 'characters', CRONE));
  });

  it('the card rested may be a Character instead of a DON!!', () => {
    const g = board([CRONE, ROCKSTAR]);
    ko(g, ROCKSTAR);
    accept(g);
    choose(g, [g.find('p1', 'characters', CRONE)]);
    expect(isRested(g, 'p1', CRONE)).toBe(true);
    expect(charsOf(g, 'p1')).toEqual([CRONE, ROCKSTAR].sort());
    expect(don(g)).toMatchObject({ active: 3, rested: 0 });
  });

  it('declining: the Character is K.O.’d as usual and nothing is rested', () => {
    const g = board([CRONE, ROCKSTAR]);
    ko(g, ROCKSTAR);
    decline(g);
    expect(charsOf(g, 'p1')).toEqual([CRONE]);
    expect(trash(g)).toEqual([ROCKSTAR]);
    expect(don(g)).toMatchObject({ active: 3, rested: 0 });
  });

  it('Crone Oil itself ({Red-Haired Pirates Allies}) is protected too: "a type including"', () => {
    const g = board([CRONE]);
    ko(g, CRONE);
    expect(decision(g)?.purpose).toBe('replacement');
    accept(g);
    payDon(g, 1);
    expect(charsOf(g, 'p1')).toEqual([CRONE]);
  });

  it('a Character without a Red-Haired Pirates type gets no replacement offer', () => {
    const g = board([CRONE, SC2.komachiyo]);
    ko(g, SC2.komachiyo);
    expectMain(g, 'p2');
    expect(charsOf(g, 'p1')).toEqual([CRONE]);
    expect(trash(g)).toEqual([SC2.komachiyo]);
  });

  it('CR 8-1-3-4-5: with nothing left that I could rest the replacement is impossible and not offered', () => {
    const g = board(
      [
        { card: CRONE, rested: true },
        { card: ROCKSTAR, rested: true },
      ],
      {
        costArea: { active: 0, rested: 3 },
        leader: { card: LD.luffy, rested: true },
      },
    );
    ko(g, ROCKSTAR);
    expectMain(g, 'p2');
    expect(charsOf(g, 'p1')).toEqual([CRONE]);
    expect(trash(g)).toEqual([ROCKSTAR]);
  });

  it('only the opponent’s EFFECT: a {Red-Haired Pirates} Character K.O.’d in battle gets no replacement offer', () => {
    const g = board([CRONE, { card: ROCKSTAR, rested: true }]);
    attack(g, g.find('p2', 'characters', WB.kingdew), g.find('p1', 'characters', ROCKSTAR));
    noDefence(g);
    expectMain(g, 'p2');
    expect(charsOf(g, 'p1')).toEqual([CRONE]);
  });

  it('QA-OP17 OP17-021: two Characters K.O.’d at once: one rest saves both and only one card is rested', () => {
    const g = board([
      { card: CRONE, rested: true },
      { card: ROCKSTAR, rested: true },
    ]);
    playCard(g, SC2.rashomon);
    accept(g);
    payDon(g, 2);
    choose(g, [g.find('p1', 'characters', CRONE), g.find('p1', 'characters', ROCKSTAR)]);
    expect(decider(g)).toBe('p1');
    expect(decision(g)?.purpose).toBe('replacement');
    accept(g);
    payDon(g, 1);
    expectMain(g, 'p2');
    expect(charsOf(g, 'p1')).toEqual([CRONE, ROCKSTAR].sort());
    expect(don(g)).toMatchObject({ active: 2, rested: 1 });
  });
});
