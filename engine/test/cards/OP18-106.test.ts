/** OP18-106 Doberman: a bare [Double Attack]. */
import { describe, expect, it } from 'vitest';
import { endCounter, game, passBlock, PLAIN_BLUE, PLAIN_PURPLE, takeDamage, V } from './helpers.ts';

const ID = 'OP18-106';

const hit = (attacker: string) => {
  const g = game(
    { leader: PLAIN_PURPLE, characters: [attacker] },
    { leader: PLAIN_BLUE, life: [V.c1, V.c1, V.c1, V.c1] },
  );
  g.act({ type: 'attack', attacker: g.find('p1', 'characters', attacker), target: g.leader('p2') });
  passBlock(g);
  endCounter(g);
  takeDamage(g);
  return g;
};

describe('OP18-106 Doberman', () => {
  it('has [Double Attack]', () => {
    const g = game({ leader: PLAIN_PURPLE, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Double Attack');
  });

  it('an unblocked attack on the Leader deals 2 damage', () => {
    const g = hit(ID);
    expect(g.zone('p2', 'life')).toHaveLength(2);
    expect(g.zone('p2', 'hand')).toHaveLength(2);
  });

  it('control: a Character without it deals 1', () => {
    const g = hit(V.c7);
    expect(g.zone('p2', 'life')).toHaveLength(3);
  });
});
