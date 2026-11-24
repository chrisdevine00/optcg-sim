/** OP17-026 Fugar. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, game, hand, none, PLAIN_BLUE, pick, V } from './helpers.ts';
import { koedInBattle, OTHER_LEADER, SHANKS_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-026';

describe('OP17-026 Fugar', () => {
  const attack = (leader: string) => {
    const g = game(
      { leader, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c2, V.c3, V.c1] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', ID),
      target: g.leader('p2'),
    });
    return g;
  };

  it('[When Attacking]: with a {Red-Haired Pirates} Leader, rest up to 1 opponent Character with a cost of 2 or less', () => {
    const g = attack(SHANKS_LEADER);
    expectDecision(g, 'choose', 'p1');
    // Cost 1 and cost 2 are candidates; the cost 3 is not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    const t = g.find('p2', 'characters', V.c2);
    pick(g, [t]);
    expect(g.card(t).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = attack(SHANKS_LEADER);
    none(g);
    expect(g.zone('p2', 'characters').some((c) => c.rested)).toBe(false);
  });

  it('with a Leader that is not {Red-Haired Pirates} nothing is rested', () => {
    const g = attack(OTHER_LEADER);
    expectDecision(g, 'block', 'p2');
    expect(g.zone('p2', 'characters').some((c) => c.rested)).toBe(false);
  });

  it('[On K.O.]: draw 1 card (no Leader condition)', () => {
    const g = koedInBattle(ID, { leader: OTHER_LEADER });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toContain(ID);
  });
});
