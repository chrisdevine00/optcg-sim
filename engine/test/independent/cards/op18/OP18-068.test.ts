/**
 * OP18-068 Senor Pink (Character, Purple, cost 8, 9000, {Donquixote Pirates}).
 *
 * Card text (cards/data):
 *   "[Once Per Turn] If this Character would be K.O.'d, you may DON!! −1 instead.
 *    [On Play] DON!! −1: Up to 1 of your opponent's Characters with a cost of 7 or less cannot be
 *    rested until the end of your opponent's next End Phase."
 *
 * Rules: the first is an optional replacement effect (CR 8-1-3-4): if accepted, DON!! −1 is paid and
 * Pink is not K.O.'d; once per turn; a replacement whose cost cannot be paid is not applicable. The
 * [On Play] cost is DON!! −1; "cannot be rested" stops attacking and [Blocker] (rules-digest 57)
 * until the end of the opponent's next End Phase; cost 7 is the maximum.
 *
 * Scenery: OP12-005 Shiki (Red, cost 8, 10000) attacks; OP10-050 Hajrudin (cost 7, 9000); OP01-023
 * Marco (cost 3); OP09-072 Franky (Purple, cost 4, [Blocker]); all vanilla ([On Play] only for Franky).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, attack, blockers, endTurn, passBlock, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  canAttackAnything,
  cardIds,
  choices,
  decline,
  donOf,
  kind,
  LDR,
  LEAD,
  mine,
  need,
  offered,
  RED,
  side,
  theirTurn,
  VAN,
} from './kit-d.ts';

const PINK = 'OP18-068';
const HAJ7 = 'OP10-050';
const SHIKI8 = 'OP12-005';
const MARCO = 'OP01-023';
const BLOCKER = 'OP09-072';

describe('OP18-068 Senor Pink: [Once Per Turn] if this Character would be K.O.’d, you may DON!! −1 instead', () => {
  /** p2's turn: two Shikis (10000) can attack p1's rested Pink (9000). p1 has `active` active DON!!. */
  function attacked(active = 2, p1: Partial<PlayerSpec> = {}): TestGame {
    return theirTurn(
      side(LDR.luffy, RED, {
        characters: [{ card: PINK, rested: true }],
        costArea: { active, rested: 0 },
        ...p1,
      }),
      side(LDR.luffy, RED, { characters: [SHIKI8, SHIKI8] }),
    );
  }

  const swing = (g: TestGame, nth: number) => {
    attack(g, g.find('p2', 'characters', SHIKI8, nth), g.find('p1', 'characters', PINK));
    passBlock(g);
    act(g, { type: 'endCounter' });
  };

  it('accepting: DON!! −1 is paid and Pink is not K.O.’d', () => {
    const g = attacked();
    swing(g, 0);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: { from: 'costActive' } });
    expect(cardIds(g, 'p1', 'characters')).toEqual([PINK]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 1, deck: 9 });
  });

  it('declining: Pink is K.O.’d and no DON!! is returned', () => {
    const g = attacked();
    swing(g, 0);
    decline(g);
    expect(cardIds(g, 'p1', 'trash')).toEqual([PINK]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, deck: 8 });
  });

  it('[Once Per Turn]: a second K.O. in the same turn is not replaced', () => {
    const g = attacked();
    swing(g, 0);
    accept(g);
    if (kind(g) === 'choose') act(g, { type: 'pick', choice: { from: 'costActive' } });
    need(g, 'main', 'p2');
    swing(g, 1);
    expect(offered(g, 'p1')).toBe(false);
    expect(cardIds(g, 'p1', 'trash')).toEqual([PINK]);
  });

  it('it can be paid with a rested DON!! too (DON!! −1 returns active or rested)', () => {
    const g = theirTurn(
      side(LDR.luffy, RED, {
        characters: [{ card: PINK, rested: true }],
        costArea: { active: 0, rested: 1 },
      }),
      side(LDR.luffy, RED, { characters: [SHIKI8] }),
    );
    swing(g, 0);
    expect(offered(g, 'p1')).toBe(true);
    accept(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([PINK]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 0, deck: 10 });
  });

  it('with no DON!! on the field the replacement cannot be used: Pink is K.O.’d', () => {
    const g = attacked(0);
    swing(g, 0);
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'trash')).toEqual([PINK]);
  });
});

describe('OP18-068 Senor Pink: [On Play] DON!! −1: an opposing Character (cost 7 or less) cannot be rested until the end of the opponent’s next End Phase', () => {
  function game(p2: Partial<PlayerSpec> = {}): TestGame {
    return mine(
      LEAD.kaido,
      { hand: [PINK], costArea: { active: 10, rested: 0 } },
      { characters: [HAJ7, 'OP12-005', MARCO], ...p2 },
    );
  }

  /** Play Pink and pay DON!! −1 from a rested DON!! (all 10 DON!! are rested after paying 8... 2 active remain). */
  function start(g: TestGame) {
    play(g, g.find('p1', 'hand', PINK));
    need(g, 'optional', 'p1');
    accept(g);
    if (
      kind(g) === 'choose' &&
      g.legal().some((a) => a.type === 'pick' && typeof a.choice === 'object')
    ) {
      act(g, { type: 'pick', choice: { from: 'costActive' } });
    }
  }

  it('the chosen Character cannot attack on the opponent’s next turn; the others can', () => {
    const g = game();
    start(g);
    need(g, 'choose', 'p1');
    act(g, { type: 'pick', choice: g.find('p2', 'characters', HAJ7) });
    expect(kind(g)).toBe('main');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(canAttackAnything(g, g.find('p2', 'characters', HAJ7))).toBe(false);
    expect(canAttackAnything(g, g.find('p2', 'characters', MARCO))).toBe(true);
  });

  it('cost boundary: cost 7 and cost 3 are offered, cost 8 (Shiki) is not', () => {
    const g = game();
    start(g);
    const first = choices(g);
    expect(first).toContain(g.find('p2', 'characters', HAJ7));
    expect(first).toContain(g.find('p2', 'characters', MARCO));
    expect(first).not.toContain(g.find('p2', 'characters', SHIKI8));
  });

  it('it cannot block either: a restricted [Blocker] is not offered against my attack this turn', () => {
    const g = game({ characters: [BLOCKER] });
    // p1's Pink was just played; attack with the Leader instead.
    start(g);
    act(g, { type: 'pick', choice: g.find('p2', 'characters', BLOCKER) });
    attack(g, g.leader('p1'), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('"up to 1": choosing none restricts nobody; declining the cost restricts nobody either', () => {
    const g = game();
    start(g);
    act(g, { type: 'done' });
    endTurn(g);
    expect(canAttackAnything(g, g.find('p2', 'characters', HAJ7))).toBe(true);
    const h = game();
    play(h, h.find('p1', 'hand', PINK));
    decline(h);
    endTurn(h);
    expect(canAttackAnything(h, h.find('p2', 'characters', HAJ7))).toBe(true);
    void VAN;
  });
});
