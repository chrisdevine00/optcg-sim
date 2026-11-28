/**
 * OP18-050 Mr.3 & Miss.Goldenweek (Character, Blue, cost 5, 6000, Counter +1000, {Baroque Works}).
 *
 * Card text (cards/data):
 *   "[Blocker]
 *    [On Play] If your Leader's type includes "Baroque Works", up to 1 of your opponent's Characters
 *    with a cost of 7 or less cannot attack until the end of your opponent's next End Phase."
 *
 * Rules: [Blocker] (CR 10-1-4). The [On Play] is conditional on the Leader's type line (checked as
 * it resolves); "up to 1" may take none; cost 7 is the maximum; the restriction lasts through the
 * opponent's next turn's End Phase and then ends (CR 8-1-3-?). Only attacks are barred, not blocks.
 *
 * Scenery: ST03-001 Crocodile (Blue Leader, {Baroque Works}); ST01-001 Luffy (no such type);
 * OP10-050 Hajrudin (Blue, cost 7, 9000), OP12-005 Shiki (Red, cost 8, 10000), OP01-023 Marco
 * (cost 3, 5000), all vanilla.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, endTurn } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  canAttackAnything,
  cardIds,
  choices,
  kind,
  LDR,
  mine,
  need,
  play,
  settleEmpty,
  toMyNextMain,
  VAN,
  theirTurn,
  RED,
  side,
} from './kit-d.ts';

const GOLDEN = 'OP18-050';
const CROC = 'ST03-001';
const H7 = 'OP10-050';
const SHIKI8 = 'OP12-005';

function game(leader: string, p2: Partial<PlayerSpec> = {}): TestGame {
  return mine(
    leader,
    { hand: [GOLDEN], costArea: { active: 10, rested: 0 } },
    { characters: [H7, SHIKI8, VAN.marco], ...p2 },
  );
}

const playGolden = (g: TestGame) => play(g, g.find('p1', 'hand', GOLDEN));

/** End p1's turn; p2 is now in its Main Phase. */
function toOpponent(g: TestGame) {
  endTurn(g);
  need(g, 'main', 'p2');
}

describe('OP18-050 Mr.3 & Miss.Goldenweek: [Blocker]', () => {
  it('it can block an attack on its owner’s Leader', () => {
    const g = theirTurn(
      side(CROC, 'OP02-060', { characters: [GOLDEN] }),
      side(LDR.luffy, RED, { characters: [VAN.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', VAN.kingdew), g.leader('p1'));
    expect(blockers(g)).toEqual([g.find('p1', 'characters', GOLDEN)]);
  });
});

describe('OP18-050 Mr.3 & Miss.Goldenweek: [On Play] with a Baroque Works Leader, an opposing Character (cost 7 or less) cannot attack', () => {
  it('the chosen Character cannot attack during the opponent’s next turn; the others can', () => {
    const g = game(CROC);
    playGolden(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', H7) });
    toOpponent(g);
    expect(canAttackAnything(g, g.find('p2', 'characters', H7))).toBe(false);
    expect(g.card(g.find('p2', 'characters', H7)).cannotAttack).toBe(true);
    expect(canAttackAnything(g, g.find('p2', 'characters', VAN.marco))).toBe(true);
  });

  it('cost boundary: cost 7 and cost 3 are offered, cost 8 is not', () => {
    const g = game(CROC);
    playGolden(g);
    need(g, 'choose', 'p1');
    const offered = choices(g);
    expect(offered).toContain(g.find('p2', 'characters', H7));
    expect(offered).toContain(g.find('p2', 'characters', VAN.marco));
    expect(offered).not.toContain(g.find('p2', 'characters', SHIKI8));
  });

  it('"until the end of your opponent’s next End Phase": it can attack again on the opponent’s following turn', () => {
    const g = game(CROC);
    playGolden(g);
    act(g, { type: 'pick', choice: g.find('p2', 'characters', VAN.marco) });
    toOpponent(g);
    expect(canAttackAnything(g, g.find('p2', 'characters', VAN.marco))).toBe(false);
    endTurn(g);
    // p1's turn, then p2's next turn.
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, g.find('p2', 'characters', VAN.marco))).toBe(true);
  });

  it('"up to 1": picking none leaves every opposing Character free to attack', () => {
    const g = game(CROC);
    playGolden(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    toOpponent(g);
    expect(canAttackAnything(g, g.find('p2', 'characters', H7))).toBe(true);
  });

  it('only 1 Character is chosen: after one pick the effect is over', () => {
    const g = game(CROC);
    playGolden(g);
    act(g, { type: 'pick', choice: g.find('p2', 'characters', H7) });
    expect(kind(g)).toBe('main');
    toOpponent(g);
    expect(canAttackAnything(g, g.find('p2', 'characters', VAN.marco))).toBe(true);
  });

  it('with a Leader that has no Baroque Works type (Luffy) nothing is asked and nobody is restricted', () => {
    const g = game(LDR.luffy);
    playGolden(g);
    settleEmpty(g);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([GOLDEN]);
    toOpponent(g);
    expect(canAttackAnything(g, g.find('p2', 'characters', H7))).toBe(true);
    void toMyNextMain;
  });
});
