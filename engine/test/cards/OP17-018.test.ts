/** OP17-018 The Power to Destroy the World. */
import { describe, expect, it } from 'vitest';
import { applyOp } from '../../src/testing.ts';
import {
  accept,
  decline,
  don,
  endCounter,
  game,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  play,
  trash,
  V,
} from './helpers.ts';
import { counterStep, useCounter } from './helpers-luffyace.ts';

const ID = 'OP17-018';
/** Vanilla Characters with 8000 base power (Thatch, Mihawk) and a 3000 one. */
const BIG1 = 'OP02-007';
const BIG2 = 'OP02-055';
const STAGE = 'OP02-070';

describe('OP17-018 The Power to Destroy the World', () => {
  const main = () =>
    game(
      { leader: PLAIN_PURPLE, hand: [ID], costArea: { active: 3, rested: 0 } },
      { leader: PLAIN_BLUE, stage: STAGE },
    );

  it("[Main]: rest 2 DON!!, K.O. up to 1 of your opponent's Stages", () => {
    const g = main();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 3 });
    pick(g, [g.find('p2', 'stage', STAGE)]);
    expect(g.zone('p2', 'stage')).toHaveLength(0);
    expect(trash(g, 'p2')).toEqual([STAGE]);
    expect(g.eventsOfType('KO')).toHaveLength(1);
  });

  it('declining the optional cost does nothing and keeps the DON!!', () => {
    const g = main();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1').active).toBe(2);
    expect(g.zone('p2', 'stage')).toHaveLength(1);
  });

  it("a Stage that cannot be K.O.'d is not removed (it is a real K.O.)", () => {
    const g = main();
    g.state = applyOp(g.state, {
      op: 'modifier',
      mod: {
        kind: 'cannotBeKOd',
        target: g.find('p2', 'stage', STAGE),
        duration: { kind: 'thisTurn', turn: 3 },
        controller: 'p2',
      },
    }).state;
    play(g, ID);
    accept(g);
    pick(g, [g.find('p2', 'stage', STAGE)]);
    expect(g.zone('p2', 'stage')).toHaveLength(1);
    expect(g.eventsOfType('KOPrevented')).toHaveLength(1);
  });

  describe('[Counter]', () => {
    const step = (characters: string[]) =>
      counterStep({
        leader: PLAIN_PURPLE,
        hand: [ID],
        characters,
        costArea: { active: 1, rested: 0 },
      });

    it('2 Characters with 8000 base power or more: +4000 power during this battle', () => {
      const g = step([BIG1, BIG2]);
      useCounter(g, ID);
      pick(g, [g.leader('p1')]);
      expect(g.power(g.leader('p1'))).toBe(9000);
      endCounter(g);
      expect(g.life('p1')).toBe(3);
    });

    it('with only 1 such Character nothing happens', () => {
      const g = step([BIG1, V.c1]);
      useCounter(g, ID);
      expect(g.power(g.leader('p1'))).toBe(5000);
    });
  });
});
