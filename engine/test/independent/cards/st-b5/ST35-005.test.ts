/**
 * ST35-005 Bartholomew Kuma (Black Character, cost 5, 5000, Counter +1000, Strike, {Revolutionary Army}).
 *
 * Card text: "This Character gains +3 cost.
 * [On Play] Give up to 1 rested DON!! card to your Leader. Then, play up to 1 Character card with 4000
 * power or less and the {Revolutionary Army} type from your hand or trash."
 *
 * Rules: CR 8-4-4-1 ("up to"), play by an effect costs no DON!!, the played Character's [On Play]
 * resolves; printed cost 5, continuous +3 makes it 8; no [Blocker].
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  attack,
  blockers,
  BLUE,
  cardIds,
  choices,
  ct,
  don,
  fill,
  hand,
  kind,
  kw,
  LDB,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  playRaw,
  SB,
  T,
  theirs,
  trash,
  TY,
} from './kit-stb5b.ts';

const KUMA = T.kuma;

function setup(handExtra: string[], trash_: string[] = []) {
  return mine(LDB.strike, { hand: [KUMA, ...handExtra], trash: trash_, deck: fill(BLUE, 15) });
}

function giveDon(g: ReturnType<typeof setup>) {
  playRaw(g, KUMA);
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: g.leader('p1') });
}

describe('ST35-005 Kuma: gains +3 cost; [On Play] give a rested DON!! to the Leader, then play a Revolutionary Army Character of 4000 power or less from hand or trash', () => {
  it('a rested DON!! goes to the Leader, then the chosen {Revolutionary Army} Character is played from hand', () => {
    const g = setup([TY.ra4000]);
    giveDon(g);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g)).toMatchObject({ rested: 4, given: 1 });
    pickCards(g, [TY.ra4000]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([KUMA, TY.ra4000].sort());
    expect(hand(g)).toEqual([]);
    expect(don(g).active).toBe(5);
  });

  it('the Character may be played from the trash instead', () => {
    const g = setup([], [TY.ra2000]);
    giveDon(g);
    expect(offeredIds(g)).toEqual([TY.ra2000]);
    pickCards(g, [TY.ra2000]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([KUMA, TY.ra2000].sort());
    expect(trash(g)).toEqual([]);
  });

  it('power boundary: 4000 is offered, 5000 and 6000 are not', () => {
    const g = setup([TY.ra4000, TY.ra5000, TY.ra6000]);
    giveDon(g);
    expect(offeredIds(g)).toEqual([TY.ra4000]);
  });

  it('type: a non-{Revolutionary Army} Character of 4000 power or less is not offered', () => {
    const g = setup([TY.ra4000, SB.c2p4, SB.c1p3]);
    giveDon(g);
    expect(offeredIds(g)).toEqual([TY.ra4000]);
  });

  it('"up to 1" play: the player may play nothing', () => {
    const g = setup([TY.ra4000]);
    giveDon(g);
    none(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KUMA]);
    expect(hand(g)).toEqual([TY.ra4000]);
  });

  it('only one card is played, however many qualify', () => {
    const g = setup([TY.ra4000], [TY.ra2000]);
    giveDon(g);
    expect(need(g, 'choose').max).toBe(1);
    expect(offeredIds(g)).toEqual([TY.ra2000, TY.ra4000].sort());
  });

  it('"up to 1" DON!!: the player may give none to the Leader', () => {
    const g = setup([TY.ra4000]);
    playRaw(g, KUMA);
    none(g);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g)).toMatchObject({ rested: 5, given: 0 });
    if (kind(g) === 'choose') none(g);
  });

  it('+3 cost: the Character on the field costs 8 (printed 5); the one it plays keeps its printed cost', () => {
    const g = setup([TY.ra4000]);
    giveDon(g);
    pickCards(g, [TY.ra4000]);
    expect(ct(g, 'p1', KUMA)).toBe(8);
    expect(ct(g, 'p1', TY.ra4000)).toBe(2);
  });

  it('it has no [Blocker]: it cannot block on the opponent turn', () => {
    const g = theirs(LDB.strike, { characters: [KUMA] });
    expect(kw(g, g.find('p1', 'characters', KUMA))).not.toContain('Blocker');
    attack(g, g.leader('p2'), g.leader('p1'));
    expect(blockers(g)).toEqual([]);
    passBlock(g);
  });

  it('the +cost is a field effect: the play cost in hand is the printed 5', () => {
    const ok = mine(LDB.strike, {
      hand: [KUMA],
      deck: fill(BLUE, 15),
      costArea: { active: 5, rested: 0 },
    });
    const i = ok.find('p1', 'hand', KUMA);
    expect(ok.legal().some((a) => a.type === 'playCard' && a.card === i)).toBe(true);
    const short = mine(LDB.strike, {
      hand: [KUMA],
      deck: fill(BLUE, 15),
      costArea: { active: 4, rested: 0 },
    });
    const j = short.find('p1', 'hand', KUMA);
    expect(short.legal().some((a) => a.type === 'playCard' && a.card === j)).toBe(false);
  });

  it('nothing to play: with no qualifying card the choice is empty', () => {
    const g = setup([TY.ra5000]);
    giveDon(g);
    expect(choices(g)).toEqual([]);
  });
});
