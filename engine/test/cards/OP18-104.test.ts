/** OP18-104 Strawberry: a bare [Banish]. */
import { describe, expect, it } from 'vitest';
import {
  endCounter,
  expectDecision,
  game,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  V,
} from './helpers.ts';
import { zoneOf } from './helpers-op18-g4.ts';

const ID = 'OP18-104';
/** OP18-038 has a [Trigger] (draw 1). */
const TRIGGERED = 'OP18-038';

const hit = (attacker: string) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [attacker] },
    { leader: PLAIN_BLUE, life: [TRIGGERED, V.c1] },
  );
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', attacker), target: g.leader('p2') });
  passBlock(g);
  endCounter(g);
  return g;
};

describe('OP18-104 Strawberry', () => {
  it('has [Banish]', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Banish');
  });

  it('the damaged Life card is trashed without offering its [Trigger]', () => {
    const g = hit(ID);
    expectDecision(g, 'main', 'p1');
    expect(zoneOf(g, 'p2', 'trash')).toEqual([TRIGGERED]);
    expect(zoneOf(g, 'p2', 'hand')).toEqual([]);
  });

  it('control: a Character without it gives the opponent the [Trigger] decision', () => {
    const g = hit(V.c7);
    expectDecision(g, 'trigger', 'p2');
  });

  it('deals 1 damage only', () => {
    const g = hit(ID);
    expect(g.zone('p2', 'life')).toHaveLength(1);
  });
});
