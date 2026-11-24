/** OP11-076 Hannyabal. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { canBlockWith, IMPEL1, IMPEL4, IMPEL_LEADER } from './helpers-op11g3.ts';

const ID = 'OP11-076';

describe('OP11-076 Hannyabal', () => {
  const start = (leader: string, hand: string[]) =>
    game(
      { leader, hand: [ID, ...hand], costArea: { active: 10, rested: 0 } },
      { leader: PLAIN_BLUE },
    );

  it('[On Play]: with an "Impel Down" Leader, play up to 1 "Impel Down" Character with cost 3 or less from hand', () => {
    const g = start(IMPEL_LEADER, [IMPEL1, IMPEL4, V.c1]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', IMPEL1)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID, IMPEL1]);
    expectDecision(g, 'main', 'p1');
  });

  it('only Impel Down Characters with cost 3 or less are candidates (cost 4 and non-Impel Down are not)', () => {
    const g = start(IMPEL_LEADER, [IMPEL4, V.c3]);
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('cost exactly 3 is allowed (and cost 2)', () => {
    const g = start(IMPEL_LEADER, ['OP02-076', 'OP02-081', IMPEL4]);
    play(g, ID);
    // OP02-076 Shiryu has cost 4: not a candidate; OP02-081 Domino has cost 2.
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
  });

  it('"up to 1": may decline', () => {
    const g = start(IMPEL_LEADER, [IMPEL1]);
    play(g, ID);
    none(g);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([IMPEL1]);
  });

  it('does nothing when the Leader does not have the "Impel Down" type', () => {
    const g = start(PLAIN_BLUE, [IMPEL1]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('has [Blocker]: it can block an attack', () => {
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID] },
      { leader: PLAIN_BLUE, characters: [V.c3] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expectDecision(g, 'block', 'p1');
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });
});
