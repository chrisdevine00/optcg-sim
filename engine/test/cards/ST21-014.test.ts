/** ST21-014 Monkey.D.Luffy. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, pick, play, PLAIN_BLUE } from './helpers.ts';
import { donArea, SHC, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'ST21-014';

describe('ST21-014 Monkey.D.Luffy', () => {
  it('[Rush]: can attack the turn it is played', () => {
    const g = game({ leader: SHC_LEADER, hand: [ID], ...donArea(5) }, { leader: PLAIN_BLUE });
    play(g, ID);
    const luffy = g.find('p1', 'characters', ID);
    expect(g.card(luffy).keywords).toContain('Rush');
    expect(
      g.isLegal({ type: 'attack', attacker: luffy, target: g.leader('p2'), player: 'p1' }),
    ).toBe(true);
  });

  const attack = (rested: number) => {
    const g = game(
      { leader: SHC_LEADER, characters: [ID, SHC.franky4], ...donArea(0, rested) },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    return g;
  };

  it('[When Attacking]: give up to 1 rested DON!! card to your Leader or 1 of your Characters', () => {
    const g = attack(2);
    expectDecision(g, 'choose', 'p1');
    // Leader, Luffy and Franky are all offered.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(3);
    const franky = g.find('p1', 'characters', SHC.franky4);
    pick(g, [franky]);
    expect(g.card(franky).don).toBe(1);
    expect(don(g, 'p1').rested).toBe(1);
    expect(g.power(franky)).toBe(7000);
  });

  it('may give to the Leader, and to the attacker itself', () => {
    const l = attack(1);
    pick(l, [l.leader('p1')]);
    expect(l.card(l.leader('p1')).don).toBe(1);
    const self = attack(1);
    pick(self, [self.find('p1', 'characters', ID)]);
    expect(self.power(self.find('p1', 'characters', ID))).toBe(7000);
  });

  it('with no rested DON!! nothing is given and the attack goes on', () => {
    const g = game(
      { leader: SHC_LEADER, characters: [ID], ...donArea(2, 0) },
      { leader: PLAIN_BLUE },
    );
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });
    // An active DON!! is never given by this effect (it says "rested").
    if (g.legal().some((a) => a.type === 'pick')) pick(g, [g.leader('p1')]);
    expect(don(g, 'p1').active).toBe(2);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expectDecision(g, 'block', 'p2');
  });
});
