/** OP16-031 Buggy. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, V } from './helpers.ts';
import { BLUE_LEADER, BUGGY_G, IMPEL_LEADER, koedInBattle, PRISONER } from './helpers-op16g2.ts';

const ID = BUGGY_G;

describe('OP16-031 Buggy', () => {
  it('[On K.O.] plays up to 1 [Prisoner of Impel Down] from your hand', () => {
    const g = koedInBattle(ID, { hand: [PRISONER, V.c1] });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', PRISONER)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([PRISONER]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
    expect(g.card(g.find('p1', 'characters', PRISONER)).rested).toBe(false);
  });

  it('only a [Prisoner of Impel Down] is a candidate (another card in hand is not)', () => {
    const g = koedInBattle(ID, { hand: [V.c1, PRISONER] });
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks.map((a) => (a.type === 'pick' ? a.choice : null))).toEqual([
      g.find('p1', 'hand', PRISONER),
    ]);
  });

  it('"up to 1": it may play none, and with two in hand only one is played', () => {
    const g = koedInBattle(ID, { hand: [PRISONER, PRISONER] });
    pick(g, [g.find('p1', 'hand', PRISONER, 0)]);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
    expect(g.zone('p1', 'hand')).toHaveLength(1);
    const g2 = koedInBattle(ID, { hand: [PRISONER] });
    none(g2);
    expect(g2.zone('p1', 'characters')).toHaveLength(0);
    expect(g2.zone('p1', 'hand')).toHaveLength(1);
  });

  it('with no [Prisoner of Impel Down] in hand there is nothing to pick', () => {
    const g = koedInBattle(ID, { hand: [V.c1] });
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('does not fire when this Character is not K.O.', () => {
    const g = game(
      { leader: IMPEL_LEADER, characters: [ID], hand: [PRISONER] },
      { leader: BLUE_LEADER },
    );
    g.act({ type: 'endTurn' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([PRISONER]);
  });
});
