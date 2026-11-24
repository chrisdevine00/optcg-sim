/**
 * OP17-004 Inuarashi & Nekomamushi (Character, Red, cost 3, 2000, Counter +2000, {Land of Wano}/
 * {Minks}/{Whitebeard Pirates}, Slash).
 *
 * Card text: "[On Play] Up to 1 of your {Land of Wano} type Characters or up to 1 of your Characters
 * with a type including "Whitebeard Pirates" gains [Rush] during this turn."
 *
 * Rules: CR 10-1-1-1 ([Rush]), CR 2-1 / "type including" (substring of a type name), CR 8-4-4-1
 * ("up to"), RL-09 ("during this turn"), CR 3-7-4 (summoning sickness).
 */
import { describe, expect, it } from 'vitest';
import { canAttack } from '../../helpers.ts';
import {
  attackers,
  choiceCards,
  choices,
  choose,
  chooseNone,
  endTurn,
  expectMain,
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

const INU = 'OP17-004';

type Placed = string | { card: string; playedThisTurn?: boolean };
function play(chars: Placed[] = [], opp: string[] = []) {
  const g = mine(LD.luffy, { hand: [INU], characters: chars }, { characters: opp });
  playCard(g, INU);
  return g;
}
const hasRush = (g: ReturnType<typeof play>, card: string, nth = 0) =>
  g.card(g.find('p1', 'characters', card, nth)).keywords.some((k) => k.startsWith('Rush'));

describe('OP17-004 Inuarashi & Nekomamushi: [On Play] a {Land of Wano} or Whitebeard Pirates Character gains [Rush] this turn', () => {
  it('can give [Rush] to itself (it is both types): it then attacks the Leader the turn it is played', () => {
    const g = play();
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'characters', INU)]);
    expectMain(g);
    const inu = g.find('p1', 'characters', INU);
    expect(attackers(g)).toContain(inu);
    expect(canAttack(g, inu, g.leader('p2'))).toBe(true);
  });

  it('a {Land of Wano} Character played this turn gains [Rush] and can attack', () => {
    const g = play([{ card: SC2.shinobu, playedThisTurn: true }]);
    const shinobu = g.find('p1', 'characters', SC2.shinobu);
    expect(attackers(g)).not.toContain(shinobu);
    choose(g, [shinobu]);
    expect(attackers(g)).toContain(shinobu);
    expect(hasRush(g, SC2.shinobu)).toBe(true);
  });

  it('a Whitebeard Pirates Character played this turn gains [Rush] and can attack', () => {
    const g = play([{ card: WB.jil, playedThisTurn: true }]);
    const jil = g.find('p1', 'characters', WB.jil);
    choose(g, [jil]);
    expect(attackers(g)).toContain(jil);
  });

  it('"a type including": {Whitebeard Pirates Allies} and {Former Whitebeard Pirates} Characters are candidates', () => {
    const g = play([WB.doma, WB.formerMarco, VAN.mohji]);
    expect(choiceCards(g).sort()).toEqual([INU, WB.doma, WB.formerMarco].sort());
  });

  it('a Character of neither kind (Mohji) is not a candidate, and neither is an opposing Character', () => {
    const g = play([VAN.mohji], [WB.kingdew]);
    expect(choices(g)).not.toContain(g.find('p1', 'characters', VAN.mohji));
    expect(choices(g)).not.toContain(g.find('p2', 'characters', WB.kingdew));
  });

  it('CR 8-4-4-1 "up to": the player may choose nobody, and then nobody gains [Rush]', () => {
    const g = play([{ card: WB.jil, playedThisTurn: true }]);
    chooseNone(g);
    expectMain(g);
    expect(hasRush(g, WB.jil)).toBe(false);
    expect(attackers(g)).not.toContain(g.find('p1', 'characters', INU));
  });

  it('only one Character gains [Rush] (at most one pick)', () => {
    const g = play([
      { card: WB.jil, playedThisTurn: true },
      { card: SC2.shinobu, playedThisTurn: true },
    ]);
    for (const s of reachablePickSets(g))
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    choose(g, [g.find('p1', 'characters', WB.jil)]);
    settleYes(g, 'p1');
    expectMain(g);
    expect(hasRush(g, WB.jil)).toBe(true);
    expect(hasRush(g, SC2.shinobu)).toBe(false);
  });

  it('RL-09: [Rush] lasts this turn only', () => {
    const g = play();
    choose(g, [g.find('p1', 'characters', INU)]);
    expect(hasRush(g, INU)).toBe(true);
    endTurn(g);
    endTurn(g);
    expect(hasRush(g, INU)).toBe(false);
  });

  it('control: a Character played this turn without the effect cannot attack (CR 3-7-4)', () => {
    const g = play([{ card: WB.jil, playedThisTurn: true }]);
    chooseNone(g);
    expect(attackers(g)).not.toContain(g.find('p1', 'characters', WB.jil));
  });
});
