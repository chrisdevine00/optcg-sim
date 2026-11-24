/**
 * OP13-118 Monkey.D.Luffy (Character, Green, cost 6, 7000, no Counter; Straw Hat Crew / Supernovas /
 * Fish-Man Island).
 *
 * Card text (cards/data):
 *   "[Double Attack]
 *    [On Play] If your Leader is multicolored, set up to 4 of your DON!! cards as active. Then, you
 *    cannot play Character cards with a base cost of 5 or more during this turn."
 *
 * Rules: [Double Attack] deals 2 damage (CR 10-1-?); "If ... Then": when the "if" is false the
 * following clause is not resolved either (CR 4-10-1); only rested DON!! can be set active; the
 * play restriction covers Character cards with a base cost of 5 or more for the rest of the turn
 * (CR 6-6-1-3) and does not touch cost 4 or less.
 */
import { takeMost } from '../../helpers.ts';
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, CH, donOf, endTurn, F, isLegal, LB, myTurn, noDefence, play, side } from './kit-b.ts';

const LUFFY = 'OP13-118';

function playGame(leader: string, p1: Partial<PlayerSpec> = {}) {
  const g = myTurn(
    side(leader, F.green, {
      hand: [LUFFY, CH.hajrudin, CH.kingdew, CH.thatch],
      costArea: { active: 10, rested: 0 },
      ...p1,
    }),
    side(LB.opp, F.red),
  );
  play(g, g.find('p1', 'hand', LUFFY));
  takeMost(g);
  return g;
}

describe('OP13-118 [Double Attack]', () => {
  it('an attack that connects takes 2 Life cards', () => {
    const g = myTurn(side(LB.multiLaw, F.green, { characters: [LUFFY] }), side(LB.opp, F.red));
    expect(g.card(g.find('p1', 'characters', LUFFY)).keywords).toContain('Double Attack');
    act(g, { type: 'attack', attacker: g.find('p1', 'characters', LUFFY), target: g.leader('p2') });
    noDefence(g);
    expect(g.life('p2')).toBe(2);
  });
});

describe('OP13-118 [On Play]: if your Leader is multicolored, set up to 4 DON!! active', () => {
  it('multicolored Leader (Green/Red): 4 of the 6 rested DON!! become active (10 active - 6 paid + 4 = 8 active)', () => {
    const g = playGame(LB.multiLaw);
    expect(donOf(g, 'p1')).toMatchObject({ active: 8, rested: 2 });
  });

  it('"up to 4": with only 2 rested DON!! available both become active', () => {
    const g = playGame(LB.multiLaw, { costArea: { active: 6, rested: 0 } });
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 2 });
  });

  it('a single-color Leader: the condition is false and no DON!! is set active (4 stay active)', () => {
    const g = playGame(LB.greenKid);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
  });
});

describe('OP13-118 [On Play] "Then, you cannot play Character cards with a base cost of 5 or more during this turn"', () => {
  it('multicolored Leader, 8 active DON!!: a cost-4 Character can still be played, cost-5 and cost-6 Characters cannot', () => {
    const g = playGame(LB.multiLaw);
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', CH.hajrudin) })).toBe(true);
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', CH.kingdew) })).toBe(false);
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', CH.thatch) })).toBe(false);
  });

  it('control: the same hand without the restriction could pay for them (8 DON!! active)', () => {
    const g = myTurn(
      side(LB.multiLaw, F.green, {
        hand: [CH.kingdew, CH.thatch],
        costArea: { active: 8, rested: 0 },
      }),
      side(LB.opp, F.red),
    );
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', CH.kingdew) })).toBe(true);
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', CH.thatch) })).toBe(true);
  });

  it('"during this turn": on your next turn a cost-5 Character can be played again', () => {
    const g = playGame(LB.multiLaw);
    endTurn(g); // p2 turn 4
    takeMost(g);
    endTurn(g); // p1 turn 5
    takeMost(g);
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', CH.kingdew) })).toBe(true);
  });
});
