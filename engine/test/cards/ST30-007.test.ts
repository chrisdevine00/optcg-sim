/** ST30-007 Portgas.D.Ace. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  don,
  endCounter,
  expectDecision,
  game,
  none,
  passBlock,
  pick,
  play,
  PLAIN_BLUE,
  takeDamage,
  V,
} from './helpers.ts';
import { canAttack, donArea, offeredPicks, SHC_LEADER } from './helpers-stg1.ts';

const ID = 'ST30-007';

describe('ST30-007 Portgas.D.Ace', () => {
  const played = (active = 5) =>
    game({ leader: SHC_LEADER, hand: [ID], ...donArea(active) }, { leader: PLAIN_BLUE });

  it('[On Play]: you may rest 1 of your DON!!: this Character gains [Rush] during this turn', () => {
    const g = played();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1').rested).toBe(4 + 1);
    const ace = g.find('p1', 'characters', ID);
    expect(g.card(ace).keywords).toContain('Rush');
    expect(canAttack(g, ace, g.leader('p2'))).toBe(true);
  });

  it('declining gives no [Rush]: it cannot attack the turn it is played', () => {
    const g = played();
    play(g, ID);
    decline(g);
    const ace = g.find('p1', 'characters', ID);
    expect(g.card(ace).keywords).not.toContain('Rush');
    expect(canAttack(g, ace, g.leader('p2'))).toBe(false);
    expect(don(g, 'p1').active).toBe(1);
  });

  it('with no active DON!! left after paying 4 the cost cannot be paid', () => {
    const g = played(4);
    play(g, ID);
    expect(g.isLegal({ type: 'optional', accept: true, player: 'p1' })).toBe(false);
  });

  it("[When Attacking]: gives up to 1 of your opponent's Characters -1000 power during this turn", () => {
    const g = game(
      { leader: SHC_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3, V.c1] },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expectDecision(g, 'choose', 'p1');
    expect(offeredPicks(g).length).toBeGreaterThan(0);
    const target = g.find('p2', 'characters', V.c3);
    pick(g, [target]);
    expect(g.power(target)).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(3000);
    expect(g.power(g.leader('p2'))).toBe(5000);
    // "during this turn": gone when the turn ends.
    passBlock(g);
    endCounter(g);
    takeDamage(g);
    g.act({ type: 'endTurn' });
    expect(g.power(target)).toBe(5000);
  });

  it('[When Attacking]: "up to 1" may choose none, and the Leader is not a candidate', () => {
    const g = game(
      { leader: SHC_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expect(offeredPicks(g)).toEqual([g.find('p2', 'characters', V.c3)]);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
    expect(g.power(g.leader('p2'))).toBe(5000);
  });
});
