/**
 * OP17-008 Jozu (Character, Red, cost 6, 8000, no Counter, {Whitebeard Pirates}, Strike).
 *
 * Card text: "[On Play] Your [Edward.Newgate] Leader's base power becomes 8000 until the end of your
 * opponent's next End Phase."
 *
 * Rules: CR 4-9-2 / 4-9-2-1 / RL-33 ("base" power; several base settings: the highest wins, QA-OP17
 * OP17-008: base 7000 then Jozu's 8000 is 8000), RL-11 ("until the end of your opponent's next End
 * Phase"). The name is exact (CR 2-1-2).
 */
import { describe, expect, it } from 'vitest';
import { endTurn, expectMain, LD, lp, mine, playCard, WB } from './kit-op17a.ts';

const JOZU = 'OP17-008';

function play(leader: string | { card: string; don: number }, p2Leader: string = LD.luffy) {
  const g = mine(
    leader,
    { hand: [JOZU], costArea: { active: typeof leader === 'string' ? 10 : 9, rested: 0 } },
    {},
    p2Leader,
  );
  playCard(g, JOZU);
  return g;
}

describe('OP17-008 Jozu: [On Play] your [Edward.Newgate] Leader’s base power becomes 8000 until the end of the opponent’s next End Phase', () => {
  it('OP17-001 [Edward.Newgate] (5000) becomes 8000', () => {
    const g = play(LD.newgate);
    expectMain(g);
    expect(lp(g, 'p1')).toBe(8000);
  });

  it('OP02-001 [Edward.Newgate] (6000) becomes 8000: any Leader with that name', () => {
    expect(lp(play(LD.newgate6), 'p1')).toBe(8000);
  });

  it('a Leader with another name is not changed (Luffy 5000)', () => {
    expect(lp(play(LD.luffy), 'p1')).toBe(5000);
  });

  it('[Ace & Newgate] (ST22-001) is not [Edward.Newgate]: not changed', () => {
    expect(lp(play('ST22-001'), 'p1')).toBe(5000);
  });

  it('it is the BASE power: a DON!! given to the Leader still adds +1000 (9000)', () => {
    expect(lp(play({ card: LD.newgate, don: 1 }), 'p1')).toBe(9000);
  });

  it('RL-11: it holds through my End Phase and the opponent’s turn, and ends with the opponent’s End Phase', () => {
    const g = play(LD.newgate);
    endTurn(g);
    expectMain(g, 'p2');
    expect(lp(g, 'p1')).toBe(8000);
    endTurn(g);
    expectMain(g, 'p1');
    expect(lp(g, 'p1')).toBe(5000);
  });

  it('the opposing Leader is not changed, even if it is also [Edward.Newgate]', () => {
    const g = play(LD.newgate, LD.newgate);
    expect(lp(g, 'p2')).toBe(5000);
    expect(lp(g, 'p1')).toBe(8000);
  });

  it('only the Leader: Jozu itself and other Characters keep their power', () => {
    const g = mine(LD.newgate, { hand: [JOZU], characters: [WB.jil] });
    playCard(g, JOZU);
    expect(g.power(g.find('p1', 'characters', JOZU))).toBe(8000);
    expect(g.power(g.find('p1', 'characters', WB.jil))).toBe(6000);
  });

  it('a rested Leader is changed as well', () => {
    const g = mine({ card: LD.newgate, rested: true }, { hand: [JOZU] });
    playCard(g, JOZU);
    expect(lp(g, 'p1')).toBe(8000);
  });
});
