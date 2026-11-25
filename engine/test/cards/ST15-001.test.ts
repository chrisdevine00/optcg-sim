/** ST15-001 Atmos (Character, cost 4, 5000, <Slash>). */
import { describe, expect, it } from 'vitest';
import { withAbilities } from '../../src/testing.ts';
import {
  endCounter,
  game,
  hand,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  passBlock,
  takeDamage,
  PURPLE,
  V,
} from './helpers.ts';
import { main } from './m6b-w1/probe.ts';
import { NEWGATE } from './helpers-w7c2.ts';

const ID = 'ST15-001';

const topToHand = {
  do: {
    move: { what: { from: 'lifeTop', owner: 'you', pick: { exactly: 1 } }, to: { zone: 'hand' } },
  },
};

describe('ST15-001 Atmos [When Attacking]', () => {
  /** p1 attacks p2's Leader with Atmos; PURPLE carries a probe that adds your top Life card to your hand. */
  const mk = (leader: string) => {
    const g = game(
      { leader, characters: [ID, PURPLE], life: [V.c1, V.c2, V.c3] },
      { leader: PLAIN_BLUE, life: [V.c4, V.c5, V.c6] },
    );
    g.state = withAbilities(g.state, PURPLE, [main([topToHand] as never)]);
    return g;
  };
  const attack = (g: ReturnType<typeof mk>) => {
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    passBlock(g);
    endCounter(g);
    takeDamage(g);
  };
  const probe = (g: ReturnType<typeof mk>) =>
    g
      .legal()
      .some(
        (a) =>
          a.type === 'activate' &&
          a.card === g.find('p1', 'characters', PURPLE) &&
          a.ability === 'a',
      );
  const tryProbe = (g: ReturnType<typeof mk>) => {
    g.act({ type: 'activate', card: g.find('p1', 'characters', PURPLE), ability: 'a' });
    return g.life('p1');
  };

  it('with an [Edward.Newgate] Leader you cannot add Life cards to your hand with your own effects this turn', () => {
    const g = mk(NEWGATE);
    attack(g);
    const before = hand(g, 'p1').length;
    if (probe(g)) tryProbe(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g, 'p1')).toHaveLength(before);
  });

  it('with another Leader the Life card can still be added', () => {
    const g = mk(PLAIN_PURPLE);
    attack(g);
    const before = hand(g, 'p1').length;
    expect(tryProbe(g)).toBe(2);
    expect(hand(g, 'p1')).toHaveLength(before + 1);
  });

  it('before the attack nothing is barred, even with Newgate', () => {
    const g = mk(NEWGATE);
    expect(tryProbe(g)).toBe(2);
  });

  it('the bar is only for this turn: next turn the Life card can be added again', () => {
    const g = mk(NEWGATE);
    attack(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(tryProbe(g)).toBe(2);
  });

  it("it stops only your own Life: an effect that takes the opponent's top Life card is not barred", () => {
    const g = mk(NEWGATE);
    g.state = withAbilities(g.state, PURPLE, [
      main([
        {
          do: {
            move: {
              what: { from: 'lifeTop', owner: 'opponent', pick: { exactly: 1 } },
              to: { zone: 'hand' },
            },
          },
        },
      ] as never),
    ]);
    attack(g);
    tryProbe(g);
    expect(g.life('p2')).toBe(1); // the attack took one, the probe another
  });
});
