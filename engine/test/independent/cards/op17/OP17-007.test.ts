/**
 * OP17-007 Kouzuki Oden (Character, Red, cost 7, 8000, no Counter, {Land of Wano}/{Kouzuki Clan}/
 * {Whitebeard Pirates}, Slash).
 *
 * Card text (verified, with the dropped "or Character card" restored): "[On Play] If your Leader is
 * [Edward.Newgate] or has the {Land of Wano} type, play up to 1 {Land of Wano} type Character card or
 * Character card with a type including "Whitebeard Pirates" with 6000 power or less from your hand."
 *
 * Rules: CR 8-3-3 (text after a failed "if" does not resolve), CR 8-4-4-1 ("up to"), "a type
 * including" (substring of a type name), CR 3-7-6-1 (a 6th Character: trash one first), playing by an
 * effect pays no cost.
 */
import { describe, expect, it } from 'vitest';
import {
  charsOf,
  choiceCards,
  choose,
  chooseNone,
  decision,
  don,
  expectMain,
  hand,
  kind,
  LD,
  mine,
  playCard,
  reachablePickSets,
  SC2,
  settleYes,
  VAN,
  WB,
} from './kit-op17a.ts';

const ODEN = 'OP17-007';
/** OP02-022 Whitebeard Pirates: a Whitebeard Pirates Event (not a Character card). */
const WB_EVENT = 'OP02-022';

function play(leader: string, inHand: string[], chars: string[] = []) {
  const g = mine(leader, { hand: [ODEN, ...inHand], characters: chars });
  playCard(g, ODEN);
  return g;
}

describe('OP17-007 Kouzuki Oden: [On Play] Newgate / {Land of Wano} Leader: play a {Land of Wano} or Whitebeard Pirates Character with 6000 power or less from hand', () => {
  it('with a [Edward.Newgate] Leader: offers exactly the Wano / Whitebeard Pirates Characters of 6000 power or less', () => {
    const g = play(LD.newgate, [
      SC2.shinobu,
      WB.jil,
      WB.formerMarco,
      WB.thatch,
      VAN.mohji,
      WB.kingdew,
    ]);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g).sort()).toEqual([SC2.shinobu, WB.jil, WB.formerMarco].sort());
  });

  it('plays the chosen card from hand for free (3 DON!! stay active after Oden’s 7)', () => {
    const g = play(LD.newgate, [WB.jil]);
    choose(g, [g.find('p1', 'hand', WB.jil)]);
    expectMain(g);
    expect(charsOf(g, 'p1')).toEqual([ODEN, WB.jil].sort());
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 3, rested: 7 });
  });

  it('a {Land of Wano} Leader works (a {Land of Wano} Character is played)', () => {
    const g = play(LD.wano, [SC2.shinobu]);
    choose(g, [g.find('p1', 'hand', SC2.shinobu)]);
    expect(charsOf(g, 'p1')).toEqual([ODEN, SC2.shinobu].sort());
  });

  it('any Leader named [Edward.Newgate] counts (OP02-001)', () => {
    const g = play(LD.newgate6, [WB.jil]);
    choose(g, [g.find('p1', 'hand', WB.jil)]);
    expect(charsOf(g, 'p1')).toEqual([ODEN, WB.jil].sort());
  });

  it('CR 8-3-3: any other Leader: nothing is asked and nothing is played', () => {
    const g = play(LD.luffy, [WB.jil]);
    expectMain(g);
    expect(hand(g)).toEqual([WB.jil]);
    expect(charsOf(g, 'p1')).toEqual([ODEN]);
  });

  it('power boundary: 6000 is playable, 7000 is not', () => {
    const g = play(LD.newgate, [WB.jil, WB.kingdew]);
    expect(choiceCards(g)).toEqual([WB.jil]);
  });

  it('the 6000-power limit applies to the {Land of Wano} Characters as well (Urashima, 9000, is not offered; Shinobu, 5000, is)', () => {
    const g = play(LD.wano, [SC2.urashima, SC2.shinobu]);
    expect(choiceCards(g)).toEqual([SC2.shinobu]);
  });

  it('only Character cards: a Whitebeard Pirates Event in hand is not offered', () => {
    const g = play(LD.newgate, [WB_EVENT, WB.jil]);
    expect(choiceCards(g)).toEqual([WB.jil]);
  });

  it('CR 8-4-4-1 "up to 1": the player may play nothing, and at most one card is played', () => {
    const g = play(LD.newgate, [WB.jil, SC2.shinobu]);
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    for (const s of sets) expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    chooseNone(g);
    expectMain(g);
    expect(hand(g).sort()).toEqual([WB.jil, SC2.shinobu].sort());
  });

  it('with no eligible card in hand nothing is asked', () => {
    const g = play(LD.newgate, [WB.thatch, VAN.mohji]);
    settleYes(g, 'p1');
    expectMain(g);
    expect(charsOf(g, 'p1')).toEqual([ODEN]);
  });

  it('CR 3-7-6-1: with 5 Characters on the field (Oden is the 5th) the played card needs one of them trashed first', () => {
    const g = play(LD.newgate, [WB.jil], [WB.doma, WB.kingdew, WB.namule, SC2.komachiyo]);
    choose(g, [g.find('p1', 'hand', WB.jil)]);
    expect(decision(g)?.purpose).toBe('characterLimit');
    choose(g, [g.find('p1', 'characters', WB.doma)]);
    expect(g.zone('p1', 'characters')).toHaveLength(5);
    expect(charsOf(g, 'p1')).toContain(WB.jil);
    expect(charsOf(g, 'p1')).not.toContain(WB.doma);
  });
});
