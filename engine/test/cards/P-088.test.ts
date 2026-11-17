/** P-088 Trafalgar Law. */
import { describe, expect, it } from 'vitest';
import { expectDecision, PURPLE } from './helpers.ts';
import { damageWith } from './triggers.ts';

/** OP14-001 Trafalgar Law: Red Leader with the "Supernovas" type. */
const SUPERNOVAS = 'OP14-001';

describe('P-088 Trafalgar Law', () => {
  it('[Trigger] with a "Supernovas" Leader and 5 or less total Life, plays this card', () => {
    // 2 Life left after the hit plus the opponent's 3: exactly 5.
    const g = damageWith('P-088', { leader: SUPERNOVAS, life: ['P-088', PURPLE, PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['P-088']);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('with 6 total Life the card is not played and is trashed (CR 10-1-5-3)', () => {
    const g = damageWith('P-088', {
      leader: SUPERNOVAS,
      life: ['P-088', PURPLE, PURPLE, PURPLE],
    });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['P-088']);
    expectDecision(g, 'main', 'p2');
  });

  it('with a Leader that does not have the "Supernovas" type it is not played', () => {
    const g = damageWith('P-088', { life: ['P-088', PURPLE] });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['P-088']);
  });

  it('declining the [Trigger] adds the card to the hand', () => {
    const g = damageWith('P-088', { leader: SUPERNOVAS, life: ['P-088', PURPLE] });
    g.act({ type: 'trigger', activate: false });
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual(['P-088']);
  });
});
