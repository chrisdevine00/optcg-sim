/**
 * OP14-023 Kikunojo (Character, cost 1, 2000, Counter +2000, {Land of Wano}/{The Akazaya Nine}).
 *
 * Card text: "[End of Your Turn] Set this Character as active."
 *
 * Rules: [End of Your Turn] fires in the End Phase of its controller's own turn, before
 * the turn passes (CR 6-6-1-1); it has no choice and no "up to". Only a rested Character can be
 * attacked (RL-17), so an active Kikunojo cannot be targeted by an attack. Characters of the
 * waiting player are not touched by the turn player's Refresh Phase (CR 6-2-4).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  attackTargets,
  chr,
  endTurn,
  kind,
  LD14,
  mine,
  need,
  noDefence,
  S14,
  settleOrders,
  swing,
} from './kit-op14a.ts';

const KIKU = 'OP14-023';

function board(chars: (string | { card: string; rested?: boolean })[]) {
  return mine(LD14.luffy, { characters: chars }, { characters: [S14.thatch] });
}

describe('OP14-023 Kikunojo: [End of Your Turn] set this Character as active', () => {
  it('printed values: cost 1, 2000, Counter +2000', () => {
    const g = board([KIKU]);
    const k = at(g, 'p1', 'characters', KIKU);
    expect(g.card(k).cost).toBe(1);
    expect(g.power(k)).toBe(2000);
    expect(g.card(k).counter).toBe(2000);
  });

  it('a rested Kikunojo is active again when my turn ends (seen at the start of the opponent turn)', () => {
    const g = board([{ card: KIKU, rested: true }]);
    expect(g.card(at(g, 'p1', 'characters', KIKU)).rested).toBe(true);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p1', 'characters', KIKU)).rested).toBe(false);
  });

  it('after attacking (rested by the attack) it is active at the end of the turn', () => {
    const g = board([KIKU]);
    swing(g, KIKU);
    noDefence(g);
    expect(g.card(at(g, 'p1', 'characters', KIKU)).rested).toBe(true);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p1', 'characters', KIKU)).rested).toBe(false);
  });

  it('an active Kikunojo simply stays active', () => {
    const g = board([KIKU]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p1', 'characters', KIKU)).rested).toBe(false);
  });

  it('it sets only itself: another rested Character of mine stays rested through the opponent turn', () => {
    const g = board([
      { card: KIKU, rested: true },
      { card: S14.marco, rested: true },
    ]);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(at(g, 'p1', 'characters', KIKU)).rested).toBe(false);
    expect(g.card(chr(g, 'p1', S14.marco)).rested).toBe(true);
  });

  it('two copies each set themselves active', () => {
    const g = board([
      { card: KIKU, rested: true },
      { card: KIKU, rested: true },
    ]);
    endTurn(g);
    // Two effects of mine trigger at once: the order question (CR 8-6) is answered with the first order.
    settleOrders(g, 'p1');
    need(g, 'main', 'p2');
    expect(g.card(g.find('p1', 'characters', KIKU, 0)).rested).toBe(false);
    expect(g.card(g.find('p1', 'characters', KIKU, 1)).rested).toBe(false);
  });

  it('it is automatic: ending the turn asks me nothing and goes straight to the opponent', () => {
    const g = board([{ card: KIKU, rested: true }]);
    endTurn(g);
    expect(kind(g)).toBe('main');
    expect(g.decider).toBe('p2');
  });

  it('being active at the end of my turn, it cannot be chosen as an attack target on the opponent turn; a rested Marco can', () => {
    const g = board([
      { card: KIKU, rested: true },
      { card: S14.marco, rested: true },
    ]);
    endTurn(g);
    need(g, 'main', 'p2');
    const targets = attackTargets(g, at(g, 'p2', 'characters', S14.thatch));
    expect(targets).toContain(chr(g, 'p1', S14.marco));
    expect(targets).not.toContain(at(g, 'p1', 'characters', KIKU));
  });

  it('without Kikunojo the same attacker may choose the rested Character: control for the previous test', () => {
    const g = board([{ card: S14.marco, rested: true }]);
    endTurn(g);
    need(g, 'main', 'p2');
    attack(g, at(g, 'p2', 'characters', S14.thatch), chr(g, 'p1', S14.marco));
    need(g, 'block', 'p1');
  });
});
