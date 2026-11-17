/** OP05-114 El Thor: [Counter] +2000 (and +2000 more vs 2 or less Life); [Trigger] K.O. by Life count. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, pick, PLAIN_BLUE, PURPLE, V } from './helpers.ts';
import { damageWith, counterStep, ids, KAL } from './helpers-kalgara.ts';

const EL_THOR = 'OP05-114';

const counter = (g: ReturnType<typeof counterStep>) => {
  g.act({ type: 'activate', card: g.find('p1', 'hand', EL_THOR), ability: 'counter' });
  pick(g, [g.leader('p1')]);
};

describe('OP05-114 El Thor', () => {
  it('[Counter] +2000 power during this battle (opponent with 3 Life: no bonus)', () => {
    const g = counterStep(
      { hand: [EL_THOR], costArea: { active: 1, rested: 0 } },
      { life: [PURPLE, PURPLE, PURPLE] },
    );
    counter(g);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('[Counter] with 2 or less opponent Life the same card gains an additional +2000', () => {
    const g = counterStep(
      { hand: [EL_THOR], costArea: { active: 1, rested: 0 } },
      { life: [PURPLE, PURPLE] },
    );
    counter(g);
    expect(g.power(g.leader('p1'))).toBe(9000);
  });

  it('the bonus goes to the card that was chosen, not to the Leader by default', () => {
    const g = game(
      { leader: KAL, hand: [EL_THOR], characters: [V.c1], costArea: { active: 1, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c7], life: [PURPLE] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c7),
      target: g.leader('p1'),
    });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'activate', card: g.find('p1', 'hand', EL_THOR), ability: 'counter' });
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000 + 4000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the power bonus lasts only for the battle', () => {
    const g = counterStep(
      { hand: [EL_THOR], costArea: { active: 1, rested: 0 } },
      { life: [PURPLE] },
    );
    counter(g);
    g.act({ type: 'endCounter' });
    while (g.legal().some((a) => a.type === 'trigger')) g.act({ type: 'trigger', activate: false });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("[Trigger] K.O.s a Character with cost at most the opponent's Life count", () => {
    const g = damageWith(EL_THOR, {}, { characters: [V.c7, V.c3, V.c4] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    // Opponent has 3 Life: cost 3 is legal, cost 4 and 7 are not.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(ids(g.zone('p2', 'trash'))).toEqual([V.c3]);
    expect(ids(g.zone('p1', 'trash'))).toEqual([EL_THOR]);
  });

  it('[Trigger] "up to 1": may K.O. nothing', () => {
    const g = damageWith(EL_THOR, {}, { characters: [V.c7, V.c3] });
    g.act({ type: 'trigger', activate: true });
    g.act({ type: 'done' });
    expect(ids(g.zone('p2', 'characters')).sort()).toEqual([V.c3, V.c7].sort());
  });
});
