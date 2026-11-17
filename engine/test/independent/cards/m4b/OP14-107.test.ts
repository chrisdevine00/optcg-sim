/**
 * OP14-107 Shakuyaku (Character, Yellow, cost 6, 5000, Counter +2000; Amazon Lily).
 *
 * Card text:
 *   "[On Play] If your opponent has 3 or less Life cards, draw 2 cards and trash 2 cards from your hand.
 *    [Trigger] If your Leader has the {Kuja Pirates} type, play this card."
 *
 * Rules: CR 4-10-1 failed "if"; "3 or less" includes 0 and 3, not 4; the trash is exact (2) and
 * mandatory, chosen by the owner of the hand (CR 8-4-4-1). Deck: A=Komachiyo B=Sai C=Marco (top first).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activateTrigger,
  BLUE,
  reachablePickSets,
  choose,
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

const SHAK = 'OP14-107';
const A = VAN.komachiyo;
const B = VAN.sai;
const C = VAN.marco;

function game(p2Life: number, p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, {
      hand: [SHAK, VAN.kingdew, VAN.thatch],
      deck: [A, B, C, ...rep(BLUE, 10)],
      costArea: { active: 6, rested: 0 },
      ...p1,
    }),
    side(LEAD.luffy, RED, { life: rep(RED, p2Life) }),
  );
}

describe('OP14-107 Shakuyaku [On Play]: opponent with 3 or less Life: draw 2, trash 2', () => {
  it('3 Life (boundary): draws A and B, then the player trashes any 2 of the 4 cards in hand', () => {
    const g = game(3);
    playFromHand(g, SHAK);
    expect(g.zone('p1', 'hand')).toHaveLength(4);
    const pairs = [...reachablePickSets(g)].filter((x) => x.includes('+'));
    expect(pairs.sort()).toEqual(
      [
        [A, B],
        [A, VAN.kingdew],
        [A, VAN.thatch],
        [B, VAN.kingdew],
        [B, VAN.thatch],
        [VAN.kingdew, VAN.thatch],
      ]
        .map((p) => [...p].sort().join('+'))
        .sort(),
    );
    choose(g, [g.find('p1', 'hand', A), g.find('p1', 'hand', VAN.kingdew)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([B, VAN.thatch].sort());
    expect(sortedIds(g, 'p1', 'trash')).toEqual([A, VAN.kingdew].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(11);
    expect(kind(g)).toBe('main');
  });

  it('0 Life: "3 or less" still holds', () => {
    const g = game(0);
    playFromHand(g, SHAK);
    expect(g.zone('p1', 'hand')).toHaveLength(4);
  });

  it('4 Life (boundary): nothing is drawn or trashed, nothing is asked', () => {
    const g = game(4);
    playFromHand(g, SHAK);
    expect(kind(g)).toBe('main');
    expect(sortedIds(g, 'p1', 'hand')).toEqual([VAN.kingdew, VAN.thatch].sort());
    expect(g.zone('p1', 'deck')).toHaveLength(13);
    expect(g.zone('p1', 'trash')).toHaveLength(0);
  });

  it('"your opponent" has the Life, not you: your own Life count is irrelevant', () => {
    const g = game(4, { life: rep(BLUE, 1) });
    playFromHand(g, SHAK);
    expect(g.zone('p1', 'hand')).toHaveLength(2);
  });

  it('exactly 2 cards are trashed and the trash is of the drawn-or-held cards the player picks (not forced to be the drawn ones)', () => {
    const g = game(2);
    playFromHand(g, SHAK);
    choose(g, [g.find('p1', 'hand', VAN.kingdew), g.find('p1', 'hand', VAN.thatch)]);
    expect(sortedIds(g, 'p1', 'hand')).toEqual([A, B].sort());
  });
});

describe('OP14-107 Shakuyaku [Trigger]: play this card if your Leader has Kuja Pirates', () => {
  function trig(leader: string) {
    const g = theirTurn(
      side(leader, BLUE, { life: [SHAK, ...rep(BLUE, 3)], deck: [A, B, C, ...rep(BLUE, 10)] }),
      side(LEAD.luffy, RED, { life: rep(RED, 4) }),
    );
    hitLeader(g);
    activateTrigger(g);
    return g;
  }

  it('Kuja Leader: played (its own [On Play] then finds the opponent with 4 Life: no draw)', () => {
    const g = trig(LD.kuja);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([SHAK]);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('other Leader: not played', () => {
    const g = trig(LD.navy);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([SHAK]);
  });
});
