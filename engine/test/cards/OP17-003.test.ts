/** OP17-003 Izo. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canAttack, NEWGATE_LEADER, RED_LEADER, WANO_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-003';

describe('OP17-003 Izo', () => {
  const start = (leader: string, opp: Parameters<typeof game>[1]['characters']) =>
    game(
      { leader, hand: [ID], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it("[On Play] with an [Edward.Newgate] Leader: up to 1 of your opponent's rested Characters gets -6000 power this turn", () => {
    const g = start(NEWGATE_LEADER, [{ card: V.c7, rested: true }]);
    play(g, ID);
    const target = g.find('p2', 'characters', V.c7);
    pick(g, [target]);
    expect(g.power(target)).toBe(3000);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(target)).toBe(9000); // "during this turn" only
  });

  it('works for a Leader with the {Land of Wano} type too', () => {
    const g = start(WANO_LEADER, [{ card: V.c7, rested: true }]);
    play(g, ID);
    const target = g.find('p2', 'characters', V.c7);
    pick(g, [target]);
    expect(g.power(target)).toBe(3000);
  });

  it('with any other Leader the effect does nothing', () => {
    const g = start(RED_LEADER, [{ card: V.c7, rested: true }]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('only rested Characters are candidates, and "up to 1" may be left empty', () => {
    const g = start(NEWGATE_LEADER, [V.c7, { card: V.c6, rested: true }]);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('[Rush: Character]: can attack a Character the turn it is played, but not the Leader', () => {
    const g = start(RED_LEADER, [{ card: V.c1, rested: true }]);
    const izo = play(g, ID);
    if (dec(g)?.kind === 'choose') none(g);
    expect(g.card(izo).keywords).toContain('Rush: Character');
    expect(canAttack(g, izo, g.find('p2', 'characters', V.c1))).toBe(true);
    expect(canAttack(g, izo, g.leader('p2'))).toBe(false);
  });
});
