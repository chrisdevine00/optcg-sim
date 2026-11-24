/**
 * ST30-008 Marco (Character, Red, cost 5, 6000, Counter +1000, {Whitebeard Pirates}).
 *
 * Card text: "[Blocker] [On K.O.] You may trash 1 Character card with 6000 power from your hand: Play
 * this Character card from your trash rested."
 *
 * Rules: [On K.O.] is for a K.O. by battle or by an effect, never for other trashing (CR 10-2-1-3,
 * RD 109, RL-15, the 5-Character rule trash is not a K.O., RD 78); "6000 power" is exactly 6000
 * (RL-49); a cost that cannot be paid cannot be paid (CR 8-3-1-3); playing from the trash costs no
 * DON!!; the card comes back as a new card, rested.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  BLUE,
  blockers,
  decision,
  don,
  hand,
  kind,
  kw,
  mine,
  need,
  no,
  offeredIds,
  payHandIfAsked,
  pickInst,
  KO_SRC,
  squardKo,
  playCardRaw,
  SL,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-stb5a.ts';

const ID = 'ST30-008';
const HAJ = 'OP01-018'; // Red, 6000
const KING = 'OP02-006'; // Red, 7000
const MARCO = 'OP01-023'; // Red, 5000
const THATCH = 'OP02-007'; // Red, cost 6, 8000

/** p2 attacks p1's Leader with an 8000 Character; p1's Marco blocks and loses. */
function koInBattle(inHand: string[]) {
  const g = theirs(SL.luffy, { characters: [ID], hand: inHand }, { characters: [THATCH] });
  attack(g, g.find('p2', 'characters', THATCH), g.leader('p1'));
  expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  act(g, { type: 'block', blocker: g.find('p1', 'characters', ID) });
  // Counter step, then damage: p1 passes.
  act(g, { type: 'endCounter' });
  return g;
}

/** p2 plays Gum-Gum Jet Pistol and K.O.s Marco by an effect. */
function koByEffect(inHand: string[]) {
  const g = theirs(
    SL.luffy,
    { characters: [ID], hand: inHand },
    { hand: [KO_SRC.squard], characters: [KO_SRC.accino] },
  );
  squardKo(g, g.find('p1', 'characters', ID));
  return g;
}

describe('ST30-008 Marco: [Blocker]', () => {
  it('has [Blocker] and can block', () => {
    const g = theirs(SL.luffy, { characters: [ID] }, { characters: [THATCH] });
    expect(kw(g, g.find('p1', 'characters', ID))).toContain('Blocker');
    attack(g, g.find('p2', 'characters', THATCH), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', ID)]);
  });
});

describe('ST30-008 Marco: [On K.O.] you may trash 1 Character with 6000 power from hand: play this card from the trash rested', () => {
  it('K.O.d while blocking: paying trashes the chosen 6000 Character and Marco returns rested', () => {
    const g = koInBattle([HAJ, KING]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHandIfAsked(g, [HAJ]);
    expect(trash(g)).toEqual([HAJ]);
    expect(hand(g)).toEqual([KING]);
    const marco = g.zone('p1', 'characters').filter((c) => c.card === ID);
    expect(marco).toHaveLength(1);
    expect(marco[0]!.rested).toBe(true);
  });

  it('K.O.d by an opponent effect: the same, Marco returns rested', () => {
    const g = koByEffect([HAJ]);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHandIfAsked(g, [HAJ]);
    expect(trash(g)).toEqual([HAJ]);
    expect(g.zone('p1', 'characters').map((c) => [c.card, c.rested])).toEqual([[ID, true]]);
  });

  it('K.O.d while attacked as a rested Character: also triggers', () => {
    const g = theirs(
      SL.luffy,
      { characters: [{ card: ID, rested: true }], hand: [HAJ] },
      { characters: [THATCH] },
    );
    attack(g, g.find('p2', 'characters', THATCH), g.find('p1', 'characters', ID));
    act(g, { type: 'block', blocker: null });
    act(g, { type: 'endCounter' });
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHandIfAsked(g, [HAJ]);
    expect(g.zone('p1', 'characters').map((c) => [c.card, c.rested])).toEqual([[ID, true]]);
  });

  it('declining the "you may": Marco stays in the trash, hand untouched', () => {
    const g = koInBattle([HAJ]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([HAJ]);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('no Character with exactly 6000 power in hand (7000 and 5000 only): cannot pay, Marco stays in the trash', () => {
    const g = koInBattle([KING, MARCO]);
    unusable(g, 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([KING, MARCO].sort());
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('an empty hand cannot pay either', () => {
    const g = koInBattle([]);
    unusable(g, 'p1');
    expect(trash(g)).toEqual([ID]);
  });

  it('offers exactly the 6000-power Characters of the hand as the cost', () => {
    const g = koInBattle([HAJ, 'OP03-006', KING, MARCO, BLUE]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, 'OP03-006'].sort());
  });

  it('playing it from the trash costs no DON!!', () => {
    const g = koInBattle([HAJ]);
    const before = don(g);
    yes(g, 'p1');
    payHandIfAsked(g, [HAJ]);
    expect(don(g)).toEqual(before);
  });

  it('the returned Marco is rested, so it cannot block a second attack', () => {
    const g = koInBattle([HAJ]);
    yes(g, 'p1');
    payHandIfAsked(g, [HAJ]);
    expect(kind(g)).toBe('main');
    expect(decision(g)?.player).toBe('p2');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
  });

  it('must not trigger when Marco is trashed by the 5-Character rule (not a K.O.)', () => {
    const fillers = [MARCO, HAJ, 'OP01-012', 'OP01-010'];
    const g = mine(SL.luffy, { characters: [ID, ...fillers], hand: [BLUE, HAJ] });
    playCardRaw(g, BLUE);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'characters', ID)]);
    expect(atMain(g)).toBe(true);
    expect(trash(g)).toEqual([ID]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(ID);
  });
});
