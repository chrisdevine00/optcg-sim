/** ST28-003 Kin'emon. */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import { endCounter, expectDecision, game, passBlock, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { ids, times, WANO_LEADER } from './helpers-lfc.ts';

const ID = 'ST28-003';

/** p2 attacks p1's Leader; the top Life card of p1 is Kin'emon and the [Trigger] is offered. */
function trigger(p1: Partial<PlayerSpec> & { leader: string }, oppLife: number) {
  const g = game(
    { life: [ID, PURPLE, PURPLE], ...p1 },
    { leader: PLAIN_BLUE, characters: [V.c7], life: times(oppLife, PURPLE) },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
  if (g.legal().some((a) => a.type === 'optional')) g.act({ type: 'optional', accept: false });
  passBlock(g);
  endCounter(g);
  expectDecision(g, 'trigger', 'p1');
  return g;
}

describe("ST28-003 Kin'emon", () => {
  it('[Trigger] with a {Land of Wano} Leader and 3 opposing Life: plays this card', () => {
    const g = trigger({ leader: WANO_LEADER }, 3);
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
    expect(ids(g, 'p1', 'hand')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([]);
  });

  it('boundary: 3 or less Life plays it, 4 does not (the activated card is trashed)', () => {
    const one = trigger({ leader: WANO_LEADER }, 1);
    one.act({ type: 'trigger', activate: true });
    expect(ids(one, 'p1', 'characters')).toEqual([ID]);
    const four = trigger({ leader: WANO_LEADER }, 4);
    four.act({ type: 'trigger', activate: true });
    expect(ids(four, 'p1', 'characters')).toEqual([]);
    expect(ids(four, 'p1', 'trash')).toEqual([ID]);
    expect(ids(four, 'p1', 'hand')).toEqual([]);
  });

  it('must not play with a Leader that is not {Land of Wano}: the activated card is trashed', () => {
    const g = trigger({ leader: PLAIN_BLUE }, 3);
    g.act({ type: 'trigger', activate: true });
    expect(ids(g, 'p1', 'characters')).toEqual([]);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('declining the [Trigger] adds the card to the hand', () => {
    const g = trigger({ leader: WANO_LEADER }, 3);
    g.act({ type: 'trigger', activate: false });
    expect(ids(g, 'p1', 'hand')).toEqual([ID]);
    expect(ids(g, 'p1', 'characters')).toEqual([]);
  });
});
