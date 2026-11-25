/** OP14-060 Donquixote Doflamingo (Leader, 5000, Life 5). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  passBlock,
  PLAIN_BLUE,
  V,
} from './helpers.ts';
import { DONQUIXOTE } from './helpers-w7c2.ts';

const ID = 'OP14-060';

describe('OP14-060 Donquixote Doflamingo [On Your Opponent’s Attack] [Once Per Turn] DON!! -1', () => {
  /** p2 (turn 4) attacks `target` with its 7000 V.c5; p1 has the Leader, a rested BLUE and an active {Donquixote Pirates}. */
  const mk = (don = 3, p1: object = {}) =>
    game(
      {
        leader: ID,
        characters: [{ card: BLUE, rested: true }, DONQUIXOTE],
        life: [V.c1, V.c2, V.c3, V.c4, V.c5],
        costArea: { active: don, rested: 0 },
        ...p1,
      },
      { leader: PLAIN_BLUE, characters: [V.c5, V.c4] },
      { turn: 4, activePlayer: 'p2' },
    );
  const attack = (
    g: ReturnType<typeof mk>,
    who: 'leader' | 'blue' = 'leader',
    attacker: string = V.c5,
  ) =>
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', attacker),
      target: who === 'leader' ? g.leader('p1') : g.find('p1', 'characters', BLUE),
    });
  const finish = (g: ReturnType<typeof mk>) => {
    passBlock(g);
    endCounter(g);
    while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
  };
  const mine = (g: ReturnType<typeof mk>) => g.zone('p1', 'characters').map((c) => c.card);

  it('returns 1 DON!! and redirects the attack on the Leader to a {Donquixote Pirates} Character', () => {
    const g = mk();
    attack(g);
    accept(g);
    expect(don(g, 'p1').active + don(g, 'p1').rested).toBe(2);
    expectDecision(g, 'choose', 'p1');
    g.act({ type: 'pick', choice: g.find('p1', 'characters', DONQUIXOTE) });
    finish(g);
    // 7000 against the 5000 Character: it is K.O.'d and the Leader took nothing.
    expect(mine(g)).toEqual([BLUE]);
    expect(g.life('p1')).toBe(5);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
  });

  it('may choose only the Leader or a {Donquixote Pirates} Character, active or rested', () => {
    const g = mk();
    attack(g, 'blue');
    accept(g);
    const offered = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(offered).toHaveLength(2);
    expect(offered).toContain(g.leader('p1'));
    expect(offered).toContain(g.find('p1', 'characters', DONQUIXOTE));
    expect(offered).not.toContain(g.find('p1', 'characters', BLUE));
  });

  it('an attack on a Character redirected to the Leader is an attack on the Leader: a Life card is taken', () => {
    const g = mk();
    attack(g, 'blue');
    accept(g);
    g.act({ type: 'pick', choice: g.leader('p1') });
    finish(g);
    expect(g.life('p1')).toBe(4);
    expect(mine(g)).toEqual([BLUE, DONQUIXOTE]);
  });

  it('declining leaves the attack where it was and returns no DON!!', () => {
    const g = mk();
    attack(g);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3 });
    finish(g);
    expect(g.life('p1')).toBe(4);
  });

  it('with no DON!! on the field there is nothing to return: it is not asked', () => {
    const g = mk(0);
    attack(g);
    expect(dec(g)?.kind).toBe('block');
  });

  it('Once Per Turn: a second attack in the same turn is not offered', () => {
    const g = mk();
    attack(g);
    accept(g);
    g.act({ type: 'pick', choice: g.find('p1', 'characters', DONQUIXOTE) });
    finish(g);
    attack(g, 'leader', V.c4);
    expect(dec(g)?.kind).toBe('block');
  });
});
