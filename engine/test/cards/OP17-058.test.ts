/** OP17-058 Kaido (Leader). RL-45, RL-34; QA-OP17 OP17-058. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  KAIDO,
  passBlock,
  pick,
  PLAIN_BLUE,
  takeDamage,
  V,
} from './helpers.ts';

describe('OP17-058 Kaido', () => {
  const defending = () =>
    game(
      { leader: KAIDO, costArea: { active: 2, rested: 0 }, donDeck: 8 },
      { leader: PLAIN_BLUE, characters: [V.c5, V.c6, V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
  const attackLeader = (g: ReturnType<typeof defending>, card: string) =>
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', card), target: g.leader('p1') });
  const finish = (g: ReturnType<typeof defending>) => {
    passBlock(g);
    endCounter(g);
    takeDamage(g);
  };

  it('RL-45: declining on one attack keeps it for a later attack; then once per turn', () => {
    const g = defending();
    attackLeader(g, V.c5);
    decline(g);
    finish(g);
    attackLeader(g, V.c6);
    accept(g);
    const t = g.find('p2', 'characters', V.c6);
    pick(g, [t]);
    expect(g.power(t)).toBe(6000);
    expect(don(g, 'p1')).toMatchObject({ deck: 9, active: 1 });
    finish(g);
    expect(g.power(t)).toBe(6000); // "during this turn", not the battle
    attackLeader(g, V.c7);
    expectDecision(g, 'block', 'p1'); // spent
  });

  it('[When Attacking] on your own turn too; with no DON!! on the field nothing is asked', () => {
    const g = game(
      { leader: KAIDO, costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c5] },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    accept(g);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(5000);
    const empty = game({ leader: KAIDO }, { leader: PLAIN_BLUE, characters: [V.c5] });
    empty.act({ type: 'attack', attacker: empty.leader('p1'), target: empty.leader('p2') });
    expectDecision(empty, 'block', 'p2');
  });

  it('DON!! −1 offers each DON!! location when there is a choice (E-D4)', () => {
    const g = game(
      { leader: { card: KAIDO, don: 1 }, costArea: { active: 1, rested: 1 } },
      { leader: PLAIN_BLUE, characters: [V.c5] },
    );
    g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
    accept(g);
    const d = expectDecision(g, 'choose', 'p1');
    expect(d.purpose).toBe('cost');
    const classes = g
      .legal()
      .flatMap((a) =>
        a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice
          ? [a.choice.from]
          : [],
      );
    expect(classes.sort()).toEqual(['costActive', 'costRested', 'given']);
    g.act({ type: 'pick', choice: { from: 'given', card: g.leader('p1') } });
    expect(g.card(g.leader('p1')).don).toBe(0);
  });
});
