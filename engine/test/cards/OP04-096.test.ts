/** OP04-096 Corrida Coliseum. */
import { describe, expect, it } from 'vitest';
import { play, PLAIN_BLUE, V } from './helpers.ts';
import { CORRIDA, DR2, DR3, DR_LEADER, mk } from './helpers-st29old.ts';

const ID = 'OP04-096';
const oppRested = { characters: [{ card: V.c1, rested: true }] };

describe('OP04-096 Corrida Coliseum', () => {
  const canAttack = (g: ReturnType<typeof mk>, attacker: string, target: string) =>
    g.isLegal({ type: 'attack', attacker, target, player: 'p1' });

  it('with a {Dressrosa} Leader, a {Dressrosa} Character can attack a Character the turn it is played', () => {
    const g = mk({ leader: DR_LEADER, stage: ID, hand: [DR2] }, oppRested);
    play(g, DR2);
    const c = g.find('p1', 'characters', DR2);
    expect(canAttack(g, c, g.find('p2', 'characters', V.c1))).toBe(true);
  });

  it('must not let it attack the Leader (only Characters)', () => {
    const g = mk({ leader: DR_LEADER, stage: ID, hand: [DR2] }, oppRested);
    play(g, DR2);
    expect(canAttack(g, g.find('p1', 'characters', DR2), g.leader('p2'))).toBe(false);
  });

  it('must not apply to a Character without the {Dressrosa} type', () => {
    const g = mk({ leader: DR_LEADER, stage: ID, hand: [V.c1] }, oppRested);
    play(g, V.c1);
    expect(canAttack(g, g.find('p1', 'characters', V.c1), g.find('p2', 'characters', V.c1))).toBe(
      false,
    );
  });

  it('must not apply when the Leader is not {Dressrosa}', () => {
    const g = mk({ leader: PLAIN_BLUE, stage: ID, hand: [DR3] }, oppRested);
    play(g, DR3);
    expect(canAttack(g, g.find('p1', 'characters', DR3), g.find('p2', 'characters', V.c1))).toBe(
      false,
    );
  });

  it('playing the Stage first and then the Character works the same (a continuous effect)', () => {
    const g = mk({ leader: DR_LEADER, hand: [CORRIDA, DR2] }, oppRested);
    play(g, CORRIDA);
    play(g, DR2);
    expect(canAttack(g, g.find('p1', 'characters', DR2), g.find('p2', 'characters', V.c1))).toBe(
      true,
    );
  });
});
