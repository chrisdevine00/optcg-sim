/**
 * OP16-047 Donquixote Doflamingo (Character, Blue, cost 3, 0 power, Counter +1000, {Donquixote Pirates}/{Impel Down}).
 *
 * Card text: "[Activate:Main] You may rest this Character: If your opponent has 8 or more cards in
 * their hand, they place 2 cards from their hand at the bottom of their deck in any order."
 *
 * Rules: CR 8-3-1 (a rest cost), CR 8-3-3 (text after a failed "if" does not resolve), CR 1-3-4 / RD 13
 * (the opponent chooses their own cards), CR 3-1-7 (the owner orders cards moved together),
 * CR 3-4-2 (hand is secret but its size is public), CR 3-7-4 (summoning sickness is about attacking).
 */
import { describe, expect, it } from 'vitest';
import {
  abilities,
  at,
  choices,
  decider,
  deck,
  fill,
  hand,
  inst,
  kind,
  LDR,
  mine,
  need,
  outcomes,
  pickInst,
  rested,
  SCN,
  theirs,
  useAbility,
  BLUE,
} from './kit-op16b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const DOFFY = 'OP16-047';
/** Eight distinct cheap cards for the opponent's hand. */
const HAND8 = [SCN.c1, SCN.c2, SCN.c3, SCN.c4, SCN.c5, SCN.c6, SCN.c7, 'OP01-010'];

function start(
  oppHand: string[],
  doffy: string | { card: string; rested?: boolean; playedThisTurn?: boolean } = DOFFY,
) {
  return mine(LDR.luffy, { characters: [doffy] }, { hand: oppHand, deck: fill(BLUE, 10) });
}
const doffyOf = (g: TestGame) => at(g, 'p1', 'characters', DOFFY);

describe('OP16-047 Donquixote Doflamingo: [Activate:Main] rest this: if the opponent has 8+ cards in hand, they put 2 at the bottom of their deck', () => {
  it('with 8 cards in the opponent’s hand: the opponent chooses 2 and they go to the bottom of their deck', () => {
    const g = start(HAND8);
    useAbility(g, doffyOf(g));
    need(g, 'choose', 'p2');
    expect(decider(g)).toBe('p2');
    pickInst(g, [inst(g, 'p2', 'hand', SCN.c6), inst(g, 'p2', 'hand', SCN.c2)]);
    need(g, 'order', 'p2');
    g.act(g.legal().find((a) => a.type === 'order')!);
    expect(hand(g, 'p2')).toHaveLength(6);
    expect(hand(g, 'p2')).not.toContain(SCN.c6);
    expect(deck(g, 'p2')).toHaveLength(12);
    expect(deck(g, 'p2').slice(-2).sort()).toEqual([SCN.c2, SCN.c6].sort());
    expect(deck(g, 'p2').slice(0, 10)).toEqual(fill(BLUE, 10));
  });

  it('the cost: Doflamingo is rested', () => {
    const g = start(HAND8);
    expect(rested(g, doffyOf(g))).toBe(false);
    useAbility(g, doffyOf(g));
    expect(rested(g, doffyOf(g))).toBe(true);
  });

  it('a hand of 9 also works, and exactly 2 cards move (7 stay)', () => {
    const g = start([...HAND8, SCN.c8]);
    useAbility(g, doffyOf(g));
    need(g, 'choose', 'p2');
    pickInst(g, [inst(g, 'p2', 'hand', SCN.c1), inst(g, 'p2', 'hand', SCN.c2)]);
    need(g, 'order', 'p2');
    g.act(g.legal().find((a) => a.type === 'order')!);
    expect(hand(g, 'p2')).toHaveLength(7);
    expect(deck(g, 'p2')).toHaveLength(12);
  });

  it('boundary: 7 cards in the opponent’s hand: nothing is placed (but the cost is still paid)', () => {
    const g = start(HAND8.slice(0, 7));
    useAbility(g, doffyOf(g));
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).toHaveLength(7);
    expect(deck(g, 'p2')).toHaveLength(10);
    expect(rested(g, doffyOf(g))).toBe(true);
  });

  it('exactly 2 cards: the opponent may not place fewer or more', () => {
    const g = start(HAND8);
    useAbility(g, doffyOf(g));
    need(g, 'choose', 'p2');
    expect(choices(g).length).toBeGreaterThanOrEqual(7);
    expect(g.legal().some((a) => a.type === 'done')).toBe(false);
    pickInst(g, [inst(g, 'p2', 'hand', SCN.c1), inst(g, 'p2', 'hand', SCN.c2)]);
    need(g, 'order', 'p2');
    g.act(g.legal().find((a) => a.type === 'order')!);
    expect(kind(g)).toBe('main');
    expect(hand(g, 'p2')).toHaveLength(6);
  });

  it('"in any order": both orders of the two cards at the bottom are reachable by the opponent', () => {
    const g = start(HAND8);
    useAbility(g, doffyOf(g));
    const tails = outcomes(g, 'p2', (x) => deck(x, 'p2').slice(-2).join('>'), 6);
    expect(tails.has(`${SCN.c1}>${SCN.c2}`) && tails.has(`${SCN.c2}>${SCN.c1}`)).toBe(true);
  });

  it('a rested Doflamingo cannot activate (the cost needs it active)', () => {
    const g = start(HAND8, { card: DOFFY, rested: true });
    expect(abilities(g, doffyOf(g))).toEqual([]);
  });

  it('it can be activated the turn it is played: resting is not attacking', () => {
    const g = start(HAND8, { card: DOFFY, playedThisTurn: true });
    expect(abilities(g, doffyOf(g))).toHaveLength(1);
    useAbility(g, doffyOf(g));
    need(g, 'choose', 'p2');
  });

  it('it is an [Activate: Main]: not usable in the opponent’s Main Phase', () => {
    const g = theirs(LDR.luffy, { characters: [DOFFY] }, {});
    expect(abilities(g, doffyOf(g))).toEqual([]);
  });

  it('must-not-happen: my own hand and deck are untouched', () => {
    const g = mine(LDR.luffy, { characters: [DOFFY], hand: [SCN.c1, SCN.c2] }, { hand: HAND8 });
    useAbility(g, doffyOf(g));
    pickInst(g, [inst(g, 'p2', 'hand', SCN.c1), inst(g, 'p2', 'hand', SCN.c2)]);
    expect(hand(g, 'p1')).toEqual([SCN.c1, SCN.c2].sort());
    expect(deck(g, 'p1')).toHaveLength(15);
  });
});
