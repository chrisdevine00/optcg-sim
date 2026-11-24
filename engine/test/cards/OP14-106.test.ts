/** OP14-106 Salome. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { OTHER_LEADER, start } from './helpers-op14g4.ts';

const ID = 'OP14-106';

describe('OP14-106 Salome', () => {
  it('has [Blocker]', () => {
    const g = start(
      { leader: OTHER_LEADER, characters: [ID] },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });

  it('[Trigger] plays this card (active, from the Life area)', () => {
    const g = damageWith(ID);
    g.act({ type: 'trigger', activate: true });
    const c = g.zone('p1', 'characters');
    expect(c.map((x) => x.card)).toEqual([ID]);
    expect(c[0]!.rested).toBe(false);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('declining the [Trigger] adds it to the hand instead', () => {
    const g = damageWith(ID);
    g.act({ type: 'trigger', activate: false });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'hand').map((x) => x.card)).toEqual([ID]);
  });

  it('[Trigger] has no condition: it plays with any Leader', () => {
    const g = damageWith(ID, { leader: 'OP14-041' });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });
});
