/** OP14-118 You'll Frighten Me... ♡ */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, passBlock, pick, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { damageGame, EMET, HANCOCK, MONET } from './helpers-hancock-rosi.ts';

describe("OP14-118 You'll Frighten Me... ♡", () => {
  /** p2 attacks p1's Leader with the 9000 Character; p1 plays the Counter with `life` Life cards. */
  const counter = (life: number) => {
    const g = game(
      {
        leader: HANCOCK,
        hand: ['OP14-118'],
        life: Array.from({ length: life }, () => PURPLE),
        costArea: { active: 1, rested: 0 },
      },
      {
        leader: PLAIN_BLUE,
        characters: [V.c7, V.c3, { card: V.c4, rested: true }],
      },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    passBlock(g);
    g.act({ type: 'activate', card: g.find('p1', 'hand', 'OP14-118'), ability: 'counter' });
    return g;
  };

  it('[Counter] with 2 or less Life: an active opponent Character cannot attack this turn', () => {
    const g = counter(2);
    expectDecision(g, 'choose', 'p1');
    // Only the active, non-attacking Character is a candidate (the attacker and the rested one are rested).
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.card(g.find('p2', 'characters', V.c3)).cannotAttack).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c4)).cannotAttack).toBeFalsy();
  });

  it('with 3 Life nothing happens', () => {
    const g = counter(3);
    expectDecision(g, 'counter', 'p1');
    expect(g.card(g.find('p2', 'characters', V.c3)).cannotAttack).toBeFalsy();
  });

  it('[Trigger] plays a Character with 6000 power or less and a [Trigger] from your hand', () => {
    const g = damageGame('OP14-118', { leader: HANCOCK, hand: [V.c4, EMET, MONET] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    // Only Monet qualifies: the 7000 Character has a [Trigger] but too much power; the vanilla has none.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'hand', MONET)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([MONET]);
  });

  it('[Trigger] with no qualifying card in hand does nothing', () => {
    const g = damageGame('OP14-118', { leader: HANCOCK, hand: [V.c4, EMET] });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
