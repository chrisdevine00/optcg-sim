/** OP17-007 Kouzuki Oden. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE } from './helpers.ts';
import {
  ATMOS,
  DOMA,
  KINGDEW,
  NEWGATE_LEADER,
  RED_LEADER,
  SHINOBU,
  WANO_LEADER,
  WB_EVENT,
  YAMATO_C,
} from './helpers-op17g1.ts';

const ID = 'OP17-007';

describe('OP17-007 Kouzuki Oden', () => {
  const start = (leader: string, handExtra: string[]) =>
    game(
      { leader, hand: [ID, ...handExtra], costArea: { active: 7, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
  const field = (g: ReturnType<typeof start>) => g.zone('p1', 'characters').map((c) => c.card);

  it('[On Play] with an [Edward.Newgate] Leader: play up to 1 "Whitebeard Pirates" Character with 6000 power or less from your hand', () => {
    const g = start(NEWGATE_LEADER, [ATMOS]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', ATMOS)]);
    expect(field(g).sort()).toEqual([ATMOS, ID].sort());
  });

  it('with a {Land of Wano} Leader: plays a {Land of Wano} Character', () => {
    const g = start(WANO_LEADER, [SHINOBU]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', SHINOBU)]);
    expect(field(g)).toContain(SHINOBU);
  });

  it('candidates: Characters of either type with 6000 power or less only (not 7000, not an Event)', () => {
    const g = start(NEWGATE_LEADER, [DOMA, SHINOBU, KINGDEW, YAMATO_C, WB_EVENT]);
    play(g, ID);
    const candidates = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null))
      .sort();
    expect(candidates).toEqual([g.find('p1', 'hand', DOMA), g.find('p1', 'hand', SHINOBU)].sort());
  });

  it('"up to 1": it may play nothing, and only one card is played', () => {
    const g = start(NEWGATE_LEADER, [ATMOS, DOMA]);
    play(g, ID);
    none(g);
    expect(field(g)).toEqual([ID]);
    const g2 = start(NEWGATE_LEADER, [ATMOS, DOMA]);
    play(g2, ID);
    pick(g2, [g2.find('p1', 'hand', DOMA)]);
    expect(field(g2).sort()).toEqual([DOMA, ID].sort());
  });

  it('with any other Leader nothing is played', () => {
    const g = start(RED_LEADER, [ATMOS]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(field(g)).toEqual([ID]);
  });
});
