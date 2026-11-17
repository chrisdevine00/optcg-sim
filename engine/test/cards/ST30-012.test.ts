/** ST30-012 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { withKeywords } from '../../src/testing.ts';
import {
  accept,
  BLUE,
  decline,
  don,
  expectDecision,
  game,
  none,
  pick,
  play,
  PLAIN_BLUE,
  PURPLE,
} from './helpers.ts';
import { donArea, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'ST30-012';

describe('ST30-012 Monkey.D.Luffy', () => {
  const played = () =>
    game({ leader: SHC_LEADER, hand: [ID], ...donArea(5) }, { leader: PLAIN_BLUE });
  const canAttack = (g: ReturnType<typeof played>) =>
    g.isLegal({
      type: 'attack',
      attacker: g.find('p1', 'characters', ID),
      target: g.leader('p2'),
      player: 'p1',
    });

  it('[On Play]: you may rest 1 DON!!; this Character gains [Rush] during this turn', () => {
    const g = played();
    play(g, ID);
    accept(g);
    expect(don(g, 'p1').rested).toBe(4 + 1); // 4 for the play cost, 1 for the effect's cost
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
    expect(canAttack(g)).toBe(true);
  });

  it('[On Play]: declining the optional cost gives no [Rush]', () => {
    const g = played();
    play(g, ID);
    decline(g);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).not.toContain('Rush');
    expect(canAttack(g)).toBe(false);
    expect(don(g, 'p1').active).toBe(1);
  });

  it('[On Play]: with no active DON!! left the optional cost is not offered', () => {
    const g = game({ leader: SHC_LEADER, hand: [ID], ...donArea(4) }, { leader: PLAIN_BLUE });
    play(g, ID);
    expect(g.legal().some((a) => a.type === 'optional')).toBe(false);
    expect(canAttack(g)).toBe(false);
  });

  it("[When Attacking]: rest up to 1 of your opponent's [Blocker] Characters", () => {
    const g = game(
      { leader: SHC_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [BLUE, PURPLE] },
    );
    g.state = withKeywords(g.state, BLUE, ['Blocker']);
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    expectDecision(g, 'choose', 'p1');
    // Only the Blocker is a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', BLUE)]);
    expect(g.card(g.find('p2', 'characters', BLUE)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', PURPLE)).rested).toBe(false);
  });

  it('[When Attacking]: with no [Blocker] the attack simply goes on; "up to" may pick none', () => {
    const none1 = game(
      { leader: SHC_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
    );
    none1.act({
      type: 'attack',
      attacker: none1.find('p1', 'characters', ID),
      target: none1.leader('p2'),
    });
    expectDecision(none1, 'block', 'p2');
    const decl = game(
      { leader: SHC_LEADER, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [BLUE] },
    );
    decl.state = withKeywords(decl.state, BLUE, ['Blocker']);
    decl.act({
      type: 'attack',
      attacker: decl.find('p1', 'characters', ID),
      target: decl.leader('p2'),
    });
    none(decl);
    expect(decl.card(decl.find('p2', 'characters', BLUE)).rested).toBe(false);
  });
});
