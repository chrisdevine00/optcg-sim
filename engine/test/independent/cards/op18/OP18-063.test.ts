/**
 * OP18-063 Kiwi & Mozu (Character, Purple, cost 3, 1000, Counter +2000, {Water Seven}/{The Franky Family}).
 *
 * Card text (cards/data):
 *   "[On Play] You may K.O. 1 of your Stages with a cost of 5 or less: Add up to 1 DON!! card as
 *    rested from your DON!! deck."
 *
 * Rules: an optional cost-effect (CR 8-3-1): the cost is K.O.'ing one of MY Stages with cost 5 or
 * less (a Stage K.O.'d goes to the trash); then "up to 1" DON!! from the DON!! deck is added to the
 * cost area RESTED; an empty DON!! deck adds nothing.
 *
 * Scenery Stages: OP03-075 Galley-La Company (Purple, cost 3), OP05-040 Birdcage (Blue, cost 5),
 * OP06-041 The Ark Noah (Blue, cost 6); none has a script that fires here.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { act, play } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  accept,
  cardIds,
  decline,
  donOf,
  kind,
  LDR,
  mine,
  need,
  offered,
  STG,
  takeMost,
} from './kit-d.ts';

const KIWI = 'OP18-063';

function game(p1: Partial<PlayerSpec> = {}, p2: Partial<PlayerSpec> = {}): TestGame {
  return mine(
    LDR.kaido,
    { hand: [KIWI], stage: STG.galley, costArea: { active: 5, rested: 0 }, ...p1 },
    p2,
  );
}

/** Play Kiwi & Mozu and accept the cost; the lone eligible Stage may be paid without a question. */
function start(g: TestGame) {
  play(g, g.find('p1', 'hand', KIWI));
  need(g, 'optional', 'p1');
  accept(g);
}

/** Answer "up to 1 DON!!" with `n` if a count question is asked. */
function count(g: TestGame, n: number) {
  if (kind(g) === 'choose' && need(g, 'choose').purpose === 'mode') {
    act(g, { type: 'pick', choice: { option: String(n) } });
  }
}

describe('OP18-063 Kiwi & Mozu: [On Play] you may K.O. 1 of your Stages (cost 5 or less): add up to 1 DON!! as rested', () => {
  it('K.O.s my Stage and adds 1 DON!! from the DON!! deck to the cost area rested', () => {
    const g = game();
    start(g);
    if (kind(g) === 'choose' && need(g, 'choose').purpose === 'cost') {
      act(g, { type: 'pick', choice: g.find('p1', 'stage', STG.galley) });
    }
    count(g, 1);
    expect(cardIds(g, 'p1', 'stage')).toEqual([]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([STG.galley]);
    // 5 active - 3 (cost) = 2 active; 3 rested from the cost + 1 added rested = 4; DON!! deck 5 -> 4.
    expect(donOf(g, 'p1')).toMatchObject({ active: 2, rested: 4, deck: 4 });
    expect(kind(g)).toBe('main');
  });

  it('boundary: a Stage with cost exactly 5 can be K.O.’d', () => {
    const g = game({ stage: STG.birdcage });
    start(g);
    if (kind(g) === 'choose' && need(g, 'choose').purpose === 'cost') {
      act(g, { type: 'pick', choice: g.find('p1', 'stage', STG.birdcage) });
    }
    count(g, 1);
    expect(cardIds(g, 'p1', 'trash')).toEqual([STG.birdcage]);
    expect(donOf(g, 'p1').deck).toBe(4);
  });

  it('boundary: a Stage with cost 6 cannot be used as the cost: nothing happens and no DON!! is added', () => {
    const g = game({ stage: STG.ark });
    play(g, g.find('p1', 'hand', KIWI));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p1', 'stage')).toEqual([STG.ark]);
    expect(donOf(g, 'p1').deck).toBe(5);
  });

  it('declining: the Stage stays and no DON!! is added', () => {
    const g = game();
    play(g, g.find('p1', 'hand', KIWI));
    expect(offered(g, 'p1')).toBe(true);
    decline(g);
    expect(cardIds(g, 'p1', 'stage')).toEqual([STG.galley]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 3, deck: 5 });
  });

  it('no Stage of mine: the cost cannot be paid', () => {
    const g = game({ stage: undefined });
    play(g, g.find('p1', 'hand', KIWI));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(donOf(g, 'p1').deck).toBe(5);
  });

  it('"your Stages": the opponent’s Stage cannot pay the cost', () => {
    const g = game({ stage: undefined }, { stage: STG.galley });
    play(g, g.find('p1', 'hand', KIWI));
    if (kind(g) === 'optional') {
      expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
      decline(g);
    }
    expect(cardIds(g, 'p2', 'stage')).toEqual([STG.galley]);
  });

  it('"up to 1": choosing 0 DON!! leaves the Stage K.O.’d (cost paid) and the DON!! deck untouched', () => {
    const g = game();
    start(g);
    if (kind(g) === 'choose' && need(g, 'choose').purpose === 'cost') {
      act(g, { type: 'pick', choice: g.find('p1', 'stage', STG.galley) });
    }
    if (kind(g) === 'choose') {
      const d = need(g, 'choose');
      expect((d.options ?? []).map((o) => o.id)).toContain('0');
    }
    count(g, 0);
    expect(cardIds(g, 'p1', 'trash')).toEqual([STG.galley]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 3, deck: 5 });
    void takeMost;
  });

  it('an empty DON!! deck adds nothing (the cost is still paid)', () => {
    const g = game({ costArea: { active: 10, rested: 0 } });
    start(g);
    if (kind(g) === 'choose' && need(g, 'choose').purpose === 'cost') {
      act(g, { type: 'pick', choice: g.find('p1', 'stage', STG.galley) });
    }
    if (kind(g) === 'choose') count(g, 1);
    expect(donOf(g, 'p1').deck).toBe(0);
    expect(cardIds(g, 'p1', 'trash')).toEqual([STG.galley]);
  });
});
