/**
 * OP17-003 Izo (Character, Red, cost 4, 6000, no Counter, {Land of Wano}/{Whitebeard Pirates}, Ranged,
 * [Rush: Character]).
 *
 * Card text: "[Rush: Character]
 * [On Play] If your Leader is [Edward.Newgate] or has the {Land of Wano} type, give up to 1 of your
 * opponent's rested Characters -6000 power during this turn."
 *
 * Rules: CR 10-1-6-1 ([Rush: Character]), CR 8-3-3 (text after a failed "if" does not resolve), CR
 * 8-4-4-1 ("up to"), RL-09 ("during this turn"), CR 7-1-1-2 (only rested Characters can be attacked).
 */
import { describe, expect, it } from 'vitest';
import { attackTargets } from '../../helpers.ts';
import {
  attackers,
  choiceCards,
  choices,
  choose,
  chooseNone,
  cp,
  endTurn,
  expectMain,
  kind,
  LD,
  mine,
  playCard,
  SC2,
  settleYes,
  WB,
} from './kit-op17a.ts';

const IZO = 'OP17-003';

function play(
  leader: string,
  opp: (string | { card: string; rested: boolean })[] = [{ card: WB.thatch, rested: true }],
) {
  const g = mine(leader, { hand: [IZO] }, { characters: opp });
  playCard(g, IZO);
  return g;
}

describe('OP17-003 Izo: [On Play] Newgate / {Land of Wano} Leader: opposing rested Character -6000 this turn', () => {
  it('a [Edward.Newgate] Leader: the chosen rested 8000 Character drops to 2000', () => {
    const g = play(LD.newgate);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expectMain(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(2000);
  });

  it('any Leader named [Edward.Newgate] counts (OP02-001, a different card)', () => {
    const g = play(LD.newgate6);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expect(cp(g, 'p2', WB.thatch)).toBe(2000);
  });

  it('a {Land of Wano} Leader works too', () => {
    const g = play(LD.wano);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expect(cp(g, 'p2', WB.thatch)).toBe(2000);
  });

  it('CR 8-3-3: any other Leader: nothing is asked and nothing changes', () => {
    const g = play(LD.luffy);
    expectMain(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(8000);
  });

  it('only RESTED opposing Characters are candidates', () => {
    const g = play(LD.newgate, [
      { card: WB.thatch, rested: true },
      WB.kingdew,
      { card: SC2.komachiyo, rested: true },
    ]);
    expect(choiceCards(g)).toEqual([SC2.komachiyo, WB.thatch].sort());
    expect(choices(g)).not.toContain(g.find('p2', 'characters', WB.kingdew));
  });

  it('with only active opposing Characters there is no target and nothing happens', () => {
    const g = play(LD.newgate, [WB.thatch]);
    settleYes(g, 'p1');
    expectMain(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(8000);
  });

  it('CR 8-4-4-1 "up to 1": the player may choose nobody', () => {
    const g = play(LD.newgate);
    chooseNone(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(8000);
  });

  it('only one Character gets -6000 even when two are candidates', () => {
    const g = play(LD.newgate, [
      { card: WB.thatch, rested: true },
      { card: WB.kingdew, rested: true },
    ]);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    expectMain(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(2000);
    expect(cp(g, 'p2', WB.kingdew)).toBe(7000);
  });

  it('RL-09: the -6000 ends with the turn', () => {
    const g = play(LD.newgate);
    choose(g, [g.find('p2', 'characters', WB.thatch)]);
    endTurn(g);
    expect(cp(g, 'p2', WB.thatch)).toBe(8000);
  });

  it('[Rush: Character]: Izo can attack a rested opposing Character the turn it is played, but not the Leader', () => {
    const g = play(LD.luffy);
    const izo = g.find('p1', 'characters', IZO);
    expect(attackers(g)).toContain(izo);
    expect(attackTargets(g, izo)).toEqual([g.find('p2', 'characters', WB.thatch)]);
    expect(attackTargets(g, izo)).not.toContain(g.leader('p2'));
  });

  it('a Character with the same cost but no Rush could not attack the turn it is played (control)', () => {
    const g = mine(
      LD.luffy,
      { hand: [WB.jil] },
      { characters: [{ card: WB.thatch, rested: true }] },
    );
    playCard(g, WB.jil);
    expect(attackers(g)).not.toContain(g.find('p1', 'characters', WB.jil));
  });
});
