/**
 * OP15-070 Fuza (Character, Purple, cost 3, 4000, Counter +1000, {Animal}/{Sky Island}).
 *
 * Card text: "All of your [Shura] cards and this Character gain [Unblockable].
 * [Opponent's Turn] All of your [Shura] cards' base power and this Character's base power become 6000."
 *
 * Rules: [Unblockable] (rules-digest: the opponent cannot activate [Blocker] against the attacker), CR
 * 4-9-2 (setting base power), CR 8-3-2-5 ([Opponent's Turn] condition), CR 6-5-5-2 (given DON!! add power on
 * the owner's turn only), CR 7-1-4 (the attacker wins a power tie).
 * Scenery: OP15-067 Shura (Purple, cost 1, 2000, {Vassals}) and OP05-106 Shura (Yellow, cost 2, 2000), both
 * placed in the scenario; OP09-072 Franky as the opposing [Blocker].
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers, passBlock, passCounter } from '../../helpers.ts';
import { at, BLUE, inst, kws, LD15, mine, RED, SCN, side, theirTurn, theirs } from './kit-op15b.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const FUZA = 'OP15-070';
const SHURA = 'OP15-067';
const SHURA2 = 'OP05-106';
const BLOCKER = 'OP09-072';
const fuza = (g: TestGame) => at(g, 'p1', 'characters', FUZA);

/** p2 attacks p1's rested `defender` with a 5000 Character; returns whether the defender survived. */
function survives(chars: string[], defender: string): boolean {
  const g = theirTurn(
    side(LD15.purple, BLUE, { characters: chars.map((c) => ({ card: c, rested: true })) }),
    side(LD15.neutral, RED, { characters: [SCN.c3] }),
  );
  attack(g, inst(g, 'p2', 'characters', SCN.c3), at(g, 'p1', 'characters', defender));
  passBlock(g);
  passCounter(g);
  return g.zone('p1', 'characters').some((c) => c.card === defender);
}

describe('OP15-070 Fuza: my [Shura] cards and Fuza gain [Unblockable]; [Opponent’s Turn] their base power becomes 6000', () => {
  it('Fuza himself has [Unblockable]', () => {
    const g = mine(LD15.purple, { characters: [FUZA] });
    expect(kws(g, fuza(g))).toContain('Unblockable');
  });

  it('my [Shura] Characters gain [Unblockable], whichever printing', () => {
    const g = mine(LD15.purple, { characters: [FUZA, SHURA, SHURA2] });
    expect(kws(g, at(g, 'p1', 'characters', SHURA))).toContain('Unblockable');
    expect(kws(g, at(g, 'p1', 'characters', SHURA2))).toContain('Unblockable');
  });

  it('a [Shura] attacker cannot be blocked by the opposing [Blocker]', () => {
    const g = mine(LD15.purple, { characters: [FUZA, SHURA] }, { characters: [BLOCKER] });
    attack(g, at(g, 'p1', 'characters', SHURA), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('control: without Fuza the same [Shura] can be blocked', () => {
    const g = mine(LD15.purple, { characters: [SHURA] }, { characters: [BLOCKER] });
    attack(g, at(g, 'p1', 'characters', SHURA), g.leader('p2'));
    expect(blockers(g)).toEqual([inst(g, 'p2', 'characters', BLOCKER)]);
  });

  it('must not: other Characters and the Leader do not gain [Unblockable]', () => {
    const g = mine(LD15.purple, { characters: [FUZA, SCN.c3] });
    expect(kws(g, at(g, 'p1', 'characters', SCN.c3))).not.toContain('Unblockable');
    expect(kws(g, g.leader('p1'))).not.toContain('Unblockable');
  });

  it('the opponent’s [Shura] does not gain [Unblockable] from my Fuza', () => {
    const g = mine(LD15.purple, { characters: [FUZA] }, { characters: [SHURA] });
    expect(kws(g, inst(g, 'p2', 'characters', SHURA))).not.toContain('Unblockable');
  });

  it('on my own turn the base power is printed: Fuza 4000, [Shura] 2000', () => {
    const g = mine(LD15.purple, { characters: [FUZA, SHURA] });
    expect(g.power(fuza(g))).toBe(4000);
    expect(g.power(at(g, 'p1', 'characters', SHURA))).toBe(2000);
  });

  it('[Opponent’s Turn]: Fuza and my [Shura] cards have 6000 power', () => {
    const g = theirs(LD15.purple, { characters: [FUZA, SHURA, SHURA2] });
    expect(g.power(fuza(g))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', SHURA))).toBe(6000);
    expect(g.power(at(g, 'p1', 'characters', SHURA2))).toBe(6000);
  });

  it('on the opponent’s turn a 6000 [Shura] survives a 5000 attacker, and a 2000 one without Fuza does not', () => {
    expect(survives([FUZA, SHURA], SHURA)).toBe(true);
    expect(survives([SHURA], SHURA)).toBe(false);
  });

  it('boundary: Fuza (6000) is K.O.’d by a 6000 attacker (tie) but not by 5000', () => {
    expect(survives([FUZA], FUZA)).toBe(true);
    const g = theirTurn(
      side(LD15.purple, BLUE, { characters: [{ card: FUZA, rested: true }] }),
      side(LD15.neutral, RED, { characters: [SCN.c4] }),
    );
    attack(g, inst(g, 'p2', 'characters', SCN.c4), fuza(g));
    passBlock(g);
    passCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('only my [Shura] cards are set to 6000: another Character keeps its own power', () => {
    const g = theirs(LD15.purple, { characters: [FUZA, SCN.c1] });
    expect(g.power(at(g, 'p1', 'characters', SCN.c1))).toBe(3000);
  });

  it('with Fuza gone the [Shura] is back to 2000 on the opponent’s turn and blockable again', () => {
    const g = theirs(LD15.purple, { characters: [SHURA] });
    expect(g.power(at(g, 'p1', 'characters', SHURA))).toBe(2000);
    expect(kws(g, at(g, 'p1', 'characters', SHURA))).not.toContain('Unblockable');
  });
});
