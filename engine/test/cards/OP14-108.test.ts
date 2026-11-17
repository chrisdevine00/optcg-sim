/** OP14-108 Silvers Rayleigh. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, pick, play, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { damageGame, HANCOCK } from './helpers-hancock-rosi.ts';

describe('OP14-108 Silvers Rayleigh', () => {
  const start = (leader: string, oppLife: number) => {
    const g = game(
      { leader, hand: ['OP14-108'], costArea: { active: 6, rested: 0 } },
      {
        leader: PLAIN_BLUE,
        characters: [V.c4, V.c5, V.c6],
        life: Array.from({ length: oppLife }, () => PURPLE),
      },
    );
    play(g, 'OP14-108');
    return g;
  };

  it('[On Play] K.O.s up to 1 Character with 7000 base power or less (multicolored Leader, opponent at 3 Life)', () => {
    const g = start(HANCOCK, 3);
    expectDecision(g, 'choose', 'p1');
    // 6000 and 7000 are candidates; the 8000 one is not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c4, V.c6]);
    expect(g.zone('p2', 'trash').map((c) => c.card)).toEqual([V.c5]);
  });

  it('does nothing when your Leader is not multicolored', () => {
    const g = start('ST03-001', 3);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expectDecision(g, 'main', 'p1');
  });

  it('does nothing when your opponent has 4 or more Life cards', () => {
    const g = start(HANCOCK, 4);
    expect(g.zone('p2', 'characters')).toHaveLength(3);
    expectDecision(g, 'main', 'p1');
  });

  it('[Trigger] activates its [On Play] effect, with its conditions', () => {
    const g = damageGame('OP14-108', { leader: HANCOCK }, { characters: [V.c4] });
    g.act({ type: 'trigger', activate: true });
    // P2 has 3 Life: the K.O. is available. The 9000 attacker is not a candidate.
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([V.c7]);
    // The card itself is not on the field: [Trigger] does not play it.
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual(['OP14-108']);
  });

  it('[Trigger] does nothing when the [On Play] condition fails', () => {
    const g = damageGame('OP14-108', { leader: 'ST03-001' }, { characters: [V.c4] });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });
});
