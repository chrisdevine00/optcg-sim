/** OP16-113 Boa Marigold. */
import { describe, expect, it } from 'vitest';
import { game, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { damageGame, HANCOCK, ROSI } from './helpers-hancock-rosi.ts';

describe('OP16-113 Boa Marigold', () => {
  const board = (life: number) =>
    game(
      {
        leader: HANCOCK,
        characters: ['OP16-113'],
        life: Array.from({ length: life }, () => PURPLE),
      },
      { leader: PLAIN_BLUE },
    );
  const kw = (g: ReturnType<typeof board>) =>
    g.card(g.find('p1', 'characters', 'OP16-113')).keywords;

  it('gains [Blocker] while you have 2 or less Life cards', () => {
    expect(kw(board(2))).toContain('Blocker');
    expect(kw(board(0))).toContain('Blocker');
  });

  it('has no [Blocker] with 3 or more Life cards', () => {
    expect(kw(board(3))).not.toContain('Blocker');
  });

  it('can actually block while it has the keyword, and not otherwise', () => {
    const attack = (life: number) => {
      const g = game(
        {
          leader: HANCOCK,
          characters: ['OP16-113'],
          life: Array.from({ length: life }, () => PURPLE),
        },
        { leader: PLAIN_BLUE, characters: [V.c3] },
        { turn: 4, activePlayer: 'p2' },
      );
      g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
      return g.legal().some((a) => a.type === 'block' && a.blocker !== null);
    };
    expect(attack(2)).toBe(true);
    expect(attack(3)).toBe(false);
  });

  it('[Trigger] with a {Kuja Pirates} Leader plays this card', () => {
    const g = damageGame('OP16-113', { leader: HANCOCK });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual(['OP16-113']);
  });

  it('[Trigger] with another Leader does not play it', () => {
    const g = damageGame('OP16-113', { leader: ROSI });
    g.act({ type: 'trigger', activate: true });
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
