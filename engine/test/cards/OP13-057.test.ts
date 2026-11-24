/** OP13-057 If I Bowed Down to Power, What's the Point in Living? */
import { describe, expect, it } from 'vitest';
import { accept, BLUE, decline, don, endCounter, play, takeDamage, times } from './helpers.ts';
import { counterStep, expectDecision, mk, useCounter, V } from './helpers-op13g2.ts';

const ID = 'OP13-057';
/** ST10-010 Trafalgar Law: a printed [Blocker] (its [On Play] does not fire when placed). */
const BLOCKER = 'ST10-010';

// Main: the Event costs 1, resting 1 more: 2 active DON!!.
const attackWith = (life: number, accepted = true) => {
  const g = mk(
    { hand: [ID], life: times(life, BLUE), characters: [V.c1], costArea: { active: 2, rested: 0 } },
    { characters: [BLOCKER] },
  );
  play(g, ID);
  if (accepted) accept(g);
  else decline(g);
  return g;
};
const leaderAttack = (g: ReturnType<typeof mk>) =>
  g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
/** Can p2 block with the [Blocker] now? */
const blockable = (g: ReturnType<typeof mk>) => {
  expectDecision(g, 'block', 'p2');
  return g.legal().some((a) => a.type === 'block' && a.blocker !== null);
};

describe("OP13-057 If I Bowed Down to Power, What's the Point in Living?", () => {
  it('[Main]: resting 1 DON!! with 1 Life, your Leader cannot be blocked this turn', () => {
    const g = attackWith(1);
    expect(don(g, 'p1')).toMatchObject({ active: 0, rested: 2 });
    leaderAttack(g);
    expect(blockable(g)).toBe(false); // the [Blocker] cannot be activated
  });

  it('with 0 Life it applies too', () => {
    const g = attackWith(0);
    leaderAttack(g);
    expect(blockable(g)).toBe(false);
  });

  it('must not apply with 2 Life (boundary): the Blocker can block', () => {
    const g = attackWith(2);
    leaderAttack(g);
    expect(blockable(g)).toBe(true);
  });

  it('applies to the Leader only: a Character that attacks can still be blocked', () => {
    const g = attackWith(1);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c1), target: g.leader('p2') });
    expect(blockable(g)).toBe(true);
  });

  it('declining the optional cost: the DON!! stays and the Leader can be blocked', () => {
    const g = attackWith(1, false);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 1 });
    leaderAttack(g);
    expect(blockable(g)).toBe(true);
  });

  it('[Counter]: your Leader gains +3000 power during this battle only', () => {
    const g = counterStep({ leader: 'ST03-001', hand: [ID], costArea: { active: 1, rested: 0 } });
    useCounter(g, ID);
    expect(g.power(g.leader('p1'))).toBe(8000);
    endCounter(g);
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
