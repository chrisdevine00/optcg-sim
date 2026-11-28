/** OP18-111 Momonga: a bare [Rush]. */
import { describe, expect, it } from 'vitest';
import { game, play, PLAIN_BLUE, PLAIN_PURPLE, V } from './helpers.ts';

const ID = 'OP18-111';

const canAttack = (card: string) => {
  const g = game(
    { leader: PLAIN_PURPLE, hand: [card], costArea: { active: 7, rested: 0 } },
    { leader: PLAIN_BLUE },
  );
  play(g, card);
  const id = g.find('p1', 'characters', card);
  return { g, id, can: g.legal().some((a) => a.type === 'attack' && a.attacker === id) };
};

describe('OP18-111 Momonga', () => {
  it('has [Rush]', () => {
    const { g, id } = canAttack(ID);
    expect(g.card(id).keywords).toContain('Rush');
  });

  it('can attack on the turn it is played', () => {
    expect(canAttack(ID).can).toBe(true);
  });

  it('control: a Character without it cannot', () => {
    expect(canAttack(V.c6).can).toBe(false);
  });
});
