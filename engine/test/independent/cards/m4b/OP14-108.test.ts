/**
 * OP14-108 Silvers Rayleigh (Character, Yellow, cost 6, 6000, Counter +1000; Former Roger Pirates).
 *
 * Card text:
 *   "[On Play] If your Leader is multicolored and your opponent has 3 or less Life cards, K.O. up to 1
 *    of your opponent's Characters with 7000 base power or less.
 *    [Trigger] Activate this card's [On Play] effect."
 *
 * Rules: both conditions required (CR 4-10-1); "base power" ignores DON!! and effects (CR 4-9-2); the
 * [Trigger] activates the On Play effect and its conditions still apply (rules digest 105 by
 * analogy); CR 8-4-4-1 "up to 1". Leaders: OP01-002 (Green/Red, multicolored), ST06-001 (Black).
 * Targets: OP02-006 Kingdew (7000), OP02-007 Thatch (8000), OP01-018 Hajrudin (6000).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activateTrigger,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  hitLeader,
  kind,
  LD,
  LEAD,
  myTurn,
  playFromHand,
  RED,
  rep,
  side,
  sortedIds,
  theirTurn,
  VAN,
} from './kit-d.ts';

const RAY = 'OP14-108';

function game(leader: string, p2Life: number, p2Chars: (string | { card: string; don: number })[]) {
  return myTurn(
    side(leader, BLUE, { hand: [RAY], costArea: { active: 6, rested: 0 } }),
    side(LEAD.luffy, RED, {
      life: rep(RED, p2Life),
      characters: p2Chars as PlayerSpec['characters'],
    }),
  );
}

describe('OP14-108 Silvers Rayleigh [On Play]: multicolored Leader and opponent at 3 or less Life: K.O. base power 7000 or less', () => {
  it('both conditions met: only base power 7000 or less is offered (boundary 7000 yes, 8000 no)', () => {
    const g = game(LD.supernova, 3, [VAN.kingdew, VAN.thatch, VAN.hajrudin]);
    playFromHand(g, RAY);
    expect(choiceCards(g)).toEqual([VAN.hajrudin, VAN.kingdew].sort());
    choose(g, [g.find('p2', 'characters', VAN.kingdew)]);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.hajrudin, VAN.thatch].sort());
    expect(sortedIds(g, 'p2', 'trash')).toEqual([VAN.kingdew]);
  });

  it('CR 8-4-4-1: "up to 1" may K.O. nothing', () => {
    const g = game(LD.supernova, 3, [VAN.kingdew]);
    playFromHand(g, RAY);
    chooseNone(g);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.kingdew]);
  });

  it('the Leader must be multicolored: a single-colour Leader K.O.s nothing', () => {
    const g = game(LD.navy, 3, [VAN.kingdew]);
    playFromHand(g, RAY);
    expect(kind(g)).toBe('main');
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.kingdew]);
  });

  it('the opponent must have 3 or less Life: at 4 nothing happens (boundary)', () => {
    const g = game(LD.supernova, 4, [VAN.kingdew]);
    playFromHand(g, RAY);
    expect(kind(g)).toBe('main');
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.kingdew]);
  });

  it('0 Life counts as "3 or less"', () => {
    const g = game(LD.supernova, 0, [VAN.kingdew]);
    playFromHand(g, RAY);
    expect(choiceCards(g)).toEqual([VAN.kingdew]);
  });

  it('only the opponent’s Characters: your own are not offered', () => {
    const g = myTurn(
      side(LD.supernova, BLUE, {
        hand: [RAY],
        characters: [VAN.hajrudin],
        costArea: { active: 6, rested: 0 },
      }),
      side(LEAD.luffy, RED, { life: rep(RED, 3), characters: [VAN.kingdew] }),
    );
    playFromHand(g, RAY);
    expect(choiceCards(g)).toEqual([VAN.kingdew]);
  });
});

describe('OP14-108 Silvers Rayleigh [Trigger]: activate the [On Play] effect', () => {
  function trig(leader: string, p2Life: number) {
    // p2's turn: p2's Hajrudin (base 6000) has 2 DON!! given, so 8000 power during p2's turn.
    const g = theirTurn(
      side(leader, BLUE, { life: [RAY, ...rep(BLUE, 3)] }),
      side(LEAD.luffy, RED, {
        life: rep(RED, p2Life),
        characters: [{ card: VAN.hajrudin, don: 2 }, VAN.thatch],
      }),
    );
    hitLeader(g);
    activateTrigger(g);
    return g;
  }

  it('conditions met: base power (not current) decides: boosted Hajrudin is a target, Thatch (base 8000) is not', () => {
    const g = trig(LD.supernova, 3);
    expect(choiceCards(g)).toEqual([VAN.hajrudin]);
    choose(g, [g.find('p2', 'characters', VAN.hajrudin)]);
    expect(sortedIds(g, 'p2', 'characters')).toEqual([VAN.thatch]);
  });

  it('conditions still apply: opponent at 4 Life, nothing happens', () => {
    const g = trig(LD.supernova, 4);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(kind(g)).toBe('main');
  });

  it('conditions still apply: single-colour Leader, nothing happens', () => {
    const g = trig(LD.navy, 3);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(kind(g)).toBe('main');
  });
});
