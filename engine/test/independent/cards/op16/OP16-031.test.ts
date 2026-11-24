/**
 * OP16-031 Buggy (Character, Green, cost 4, 5000, Counter +1000, {Buggy Pirates}/{Impel Down}, Slash).
 *
 * Card text: "[On K.O.] Play up to 1 [Prisoner of Impel Down] card from your hand."
 *
 * Rules: CR 10-2-17 ([On K.O.], by battle or effect), playing by an effect pays no cost (CR 8-5-1),
 * "up to 1" (CR 8-4-4-1), a card name in brackets is an exact name match. Scenery: OP16-042
 * Prisoner of Impel Down (Blue, cost 6, 6000, {Impel Down}), OP09-077 Gum-Gum Lightning.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  BLUE,
  charIds,
  choose,
  decision,
  don,
  fill,
  hand,
  mayChooseNone,
  mine,
  need,
  noDefence,
  none,
  OL,
  OV,
  offeredIds,
  opponentKOs,
  pickInst,
  restedChar,
  RED,
  SC2,
  skipEmpty,
  side,
  theirs,
  theirTurn,
  trash,
  atMain,
} from './kit-op16a.ts';

const BUGGY = 'OP16-031';
const PRISONER = 'OP16-042';
const OTHER_ID = 'OP16-046'; // Jinbe: {Impel Down}, but not named Prisoner of Impel Down

/** p2's turn: p2's 8000 Character attacks my rested Buggy; I defend with `inHand`. */
function koBuggy(inHand: string[], extra: string[] = []) {
  const g = theirTurn(
    side(OL.impel, BLUE, {
      characters: [{ card: BUGGY, rested: true }, ...extra],
      hand: inHand,
      life: fill(BLUE, 4),
    }),
    side(OL.luffy, RED, { characters: [OV.thatch] }),
  );
  attack(g, at(g, 'p2', 'characters', OV.thatch), at(g, 'p1', 'characters', BUGGY));
  noDefence(g);
  return g;
}

describe('OP16-031 Buggy: [On K.O.] play up to 1 [Prisoner of Impel Down] from hand', () => {
  it('K.O.d in battle: asks me (no "you may" question) which [Prisoner of Impel Down] to play', () => {
    const g = koBuggy([PRISONER]);
    expect(trash(g)).toEqual([BUGGY]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PRISONER]);
  });

  it('plays it free of cost (cost 6, no DON!! paid), active', () => {
    const g = koBuggy([PRISONER]);
    pickInst(g, [g.find('p1', 'hand', PRISONER)]);
    expect(charIds(g, 'p1')).toEqual([PRISONER]);
    expect(hand(g)).toEqual([]);
    expect(restedChar(g, 'p1', PRISONER)).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 0 });
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('only a card NAMED [Prisoner of Impel Down] is offered: another {Impel Down} card or a vanilla is not', () => {
    const g = koBuggy([PRISONER, OTHER_ID, OV.sai4]);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([PRISONER]);
  });

  it('"up to 1": may play nothing; the card stays in hand', () => {
    const g = koBuggy([PRISONER]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(charIds(g, 'p1')).toEqual([]);
    expect(hand(g)).toEqual([PRISONER]);
  });

  it('plays only one when two are in hand', () => {
    const g = koBuggy([PRISONER, PRISONER]);
    pickInst(g, [g.find('p1', 'hand', PRISONER)]);
    expect(charIds(g, 'p1')).toEqual([PRISONER]);
    expect(hand(g)).toEqual([PRISONER]);
  });

  it('with no [Prisoner of Impel Down] in hand nothing is played', () => {
    const g = koBuggy([OTHER_ID, OV.sai4]);
    skipEmpty(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(charIds(g, 'p1')).toEqual([]);
    expect(hand(g)).toEqual([OV.sai4, OTHER_ID].sort());
  });

  it('only from hand: a Prisoner in the trash or on the field does not get played again', () => {
    const g = theirTurn(
      side(OL.impel, BLUE, {
        characters: [{ card: BUGGY, rested: true }, PRISONER],
        trash: [PRISONER],
        life: fill(BLUE, 4),
      }),
      side(OL.luffy, RED, { characters: [OV.thatch] }),
    );
    attack(g, at(g, 'p2', 'characters', OV.thatch), at(g, 'p1', 'characters', BUGGY));
    noDefence(g);
    skipEmpty(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(charIds(g, 'p1')).toEqual([PRISONER]);
  });

  it('also triggers when an opposing EFFECT K.O.s Buggy', () => {
    const g = theirs(
      OL.impel,
      { characters: [BUGGY], hand: [PRISONER] },
      { hand: [SC2.lightning], characters: [OV.kingdew5] },
    );
    opponentKOs(g, at(g, 'p1', 'characters', BUGGY));
    expect(decision(g)?.kind).toBe('choose');
    choose(g, [g.find('p1', 'hand', PRISONER)]);
    expect(charIds(g, 'p1')).toEqual([PRISONER]);
    expect(trash(g)).toEqual([BUGGY]);
  });

  it('does not trigger when Buggy survives the battle (it wins)', () => {
    const g = mine(
      OL.impel,
      { characters: [BUGGY], hand: [PRISONER] },
      { characters: [{ card: OV.sai4, rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', BUGGY), at(g, 'p2', 'characters', OV.sai4));
    noDefence(g);
    expect(atMain(g, 'p1')).toBe(true);
    expect(hand(g)).toEqual([PRISONER]);
    expect(charIds(g, 'p1')).toEqual([BUGGY]);
  });
});
