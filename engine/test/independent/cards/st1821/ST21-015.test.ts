/**
 * ST21-015 Roronoa Zoro (Red Character, cost 4, 5000, Counter +1000, {Straw Hat Crew}).
 * "[DON!! x2] This Character gains [Rush].
 * [On K.O.] Play up to 1 red Character card with 6000 power or less other than [Roronoa Zoro] from
 * your hand."
 * Rules: [Rush] only while 2 or more DON!! are given to it; [On K.O.] has no DON!! condition; the
 * played card is red, a Character, at most 6000 power and not named [Roronoa Zoro]; the hand is
 * hidden, so the pick is asked even when nothing qualifies.
 */
import { describe, expect, it } from 'vitest';
import {
  askedEmpty,
  canAttackAnything,
  cost,
  hand,
  inst,
  kind,
  LD,
  mine,
  need,
  none,
  offeredIds,
  opponentKOs,
  pickCards,
  SC,
  theirs,
  theyKo,
  atMain,
  reachablePickSets,
} from './kit-st1821a.ts';

const ID = 'ST21-015';
const OTHER_ZORO_A = 'OP01-025'; // [Roronoa Zoro], red, 5000
const OTHER_ZORO_B = 'ST01-013'; // [Roronoa Zoro], red, 5000
const LIGHTNING = 'OP09-077';

describe('ST21-015 Roronoa Zoro: [DON!! x2] gains [Rush]', () => {
  it('with 2 DON!! given and played this turn, it can attack', () => {
    const g = mine(LD.luffy, {
      characters: [{ card: ID, don: 2, playedThisTurn: true }],
      ...cost(5),
    });
    expect(canAttackAnything(g, inst(g, 'p1', 'characters', ID))).toBe(true);
    expect(g.card(inst(g, 'p1', 'characters', ID)).keywords).toContain('Rush');
  });

  it('with only 1 DON!! given it has no Rush and cannot attack the turn it was played', () => {
    const g = mine(LD.luffy, {
      characters: [{ card: ID, don: 1, playedThisTurn: true }],
      ...cost(5),
    });
    expect(canAttackAnything(g, inst(g, 'p1', 'characters', ID))).toBe(false);
    expect(g.card(inst(g, 'p1', 'characters', ID)).keywords).not.toContain('Rush');
  });

  it('with no DON!! given and played this turn it cannot attack', () => {
    const g = mine(LD.luffy, { characters: [{ card: ID, playedThisTurn: true }], ...cost(5) });
    expect(canAttackAnything(g, inst(g, 'p1', 'characters', ID))).toBe(false);
  });
});

describe('ST21-015 Roronoa Zoro: [On K.O.] play a red Character with 6000 power or less from hand', () => {
  const HAND = [SC.c3, SC.c4, SC.c5, SC.c1, OTHER_ZORO_A, OTHER_ZORO_B];

  function ko(don = 0, h: string[] = HAND) {
    const g = theirs(LD.luffy, { characters: [{ card: ID, don, rested: true }], hand: h });
    theyKo(g, inst(g, 'p1', 'characters', ID));
    return g;
  }

  it('offers exactly the red Characters of 6000 power or less that are not [Roronoa Zoro]', () => {
    const g = ko();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c3, SC.c4].sort());
  });

  it('power boundary: 6000 qualifies, 7000 does not; colour: a blue 3000 Character does not', () => {
    const g = ko(0, [SC.c4, SC.c5, SC.c1]);
    expect(offeredIds(g)).toEqual([SC.c4]);
  });

  it('the other [Roronoa Zoro] cards (same name, other card numbers) are excluded', () => {
    const g = ko(0, [OTHER_ZORO_A, OTHER_ZORO_B, SC.c3]);
    expect(offeredIds(g)).toEqual([SC.c3]);
  });

  it('the pick enters play active and leaves my hand; the K.O.d Zoro is in the trash', () => {
    const g = ko();
    pickCards(g, [SC.c4]);
    expect(atMain(g, 'p2')).toBe(true);
    const played = g.zone('p1', 'characters');
    expect(played.map((c) => c.card)).toEqual([SC.c4]);
    expect(played[0]!.rested).toBe(false);
    expect(hand(g)).not.toContain(SC.c4);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it('it needs no DON!!: with 2 DON!! given the same prompt appears', () => {
    const g = ko(2);
    expect(offeredIds(g)).toEqual([SC.c3, SC.c4].sort());
  });

  it('"up to 1": choosing nothing plays nothing', () => {
    const g = ko();
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(hand(g)).toEqual([...HAND].sort());
  });

  it('at most 1 Character is played even when two qualify', () => {
    const sets = reachablePickSets(ko());
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it('with nothing qualifying in hand the pick is still asked (empty): no prompt depends on the hidden hand', () => {
    const g = ko(0, [SC.c5, SC.c1]);
    askedEmpty(g);
    expect(kind(g)).toBe('main');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('it also fires when an opponent effect K.O.s Zoro', () => {
    const g = theirs(LD.luffy, { characters: [ID], hand: [SC.c4] }, { hand: [LIGHTNING] });
    opponentKOs(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC.c4]);
  });
});
