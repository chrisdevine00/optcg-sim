/** OP17-013 Portgas.D.Ace. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { BIG10, NEWGATE_LEADER, RED_LEADER, WANO_LEADER } from './helpers-op17g1.ts';

const ID = 'OP17-013';

describe('OP17-013 Portgas.D.Ace', () => {
  const start = (leader: string, opp: Parameters<typeof game>[1]['characters'], active: number) =>
    game(
      { leader, hand: [ID], costArea: { active, rested: 0 } },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it('in hand: -2 cost while your opponent has a Character with 10000 power or more', () => {
    const g = start(RED_LEADER, [BIG10], 4);
    const id = g.find('p1', 'hand', ID);
    expect(g.card(id).cost).toBe(4);
    expect(g.isLegal({ type: 'playCard', card: id, player: 'p1' })).toBe(true);
  });

  it('without such a Character it costs its printed 6 (4 DON!! are not enough)', () => {
    const g = start(RED_LEADER, [V.c7], 4);
    const id = g.find('p1', 'hand', ID);
    expect(g.card(id).cost).toBe(6);
    expect(g.isLegal({ type: 'playCard', card: id, player: 'p1' })).toBe(false);
  });

  it("[On Play] with an [Edward.Newgate] Leader: up to 1 of your opponent's rested Characters gets -6000 power this turn", () => {
    const g = start(NEWGATE_LEADER, [{ card: V.c7, rested: true }, V.c6], 6);
    play(g, ID);
    // The active Character is not a candidate.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    const target = g.find('p2', 'characters', V.c7);
    pick(g, [target]);
    expect(g.power(target)).toBe(3000);
    expect(g.power(g.find('p2', 'characters', V.c6))).toBe(8000);
  });

  it('"up to 1": may be left empty', () => {
    const g = start(NEWGATE_LEADER, [{ card: V.c7, rested: true }], 6);
    play(g, ID);
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });

  it('a {Land of Wano} Leader that is not [Edward.Newgate] does not trigger it (unlike OP17-003)', () => {
    const g = start(WANO_LEADER, [{ card: V.c7, rested: true }], 6);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
  });
});
