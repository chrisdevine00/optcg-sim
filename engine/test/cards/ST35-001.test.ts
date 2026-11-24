/** ST35-001 Hack. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { idsOf, offers, P2000_A, P2000_B, WB_LEADER } from './helpers-stg2.ts';

const ID = 'ST35-001';
const LINDBERGH = 'ST35-002';

describe('ST35-001 Hack', () => {
  const start = (opp: string[]) =>
    game(
      { leader: WB_LEADER, hand: [ID], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: opp },
    );

  it('has [Blocker]', () => {
    const g = game({ leader: WB_LEADER, characters: [ID] }, { leader: PLAIN_BLUE });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play] K.O. up to 1 opposing Character with 2000 base power (boundary)', () => {
    const g = start([P2000_A, V.c1]);
    play(g, ID);
    expect(offers(g)).toEqual([g.find('p2', 'characters', P2000_A)]);
    pick(g, [g.find('p2', 'characters', P2000_A)]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
    expect(idsOf(g, 'p2', 'trash')).toEqual([P2000_A]);
    expectDecision(g, 'main', 'p1');
  });

  it('3000 base power is not a candidate; your own Characters are never offered', () => {
    const g = game(
      { leader: WB_LEADER, hand: [ID], characters: [P2000_B], costArea: { active: 4, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    play(g, ID);
    expectDecision(g, 'main', 'p1'); // no candidate: nothing to ask
    expect(idsOf(g, 'p1', 'characters')).toEqual([P2000_B, ID]);
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });

  it('"up to 1": may K.O. nothing', () => {
    const g = start([P2000_A]);
    play(g, ID);
    g.act({ type: 'done' });
    expect(idsOf(g, 'p2', 'characters')).toEqual([P2000_A]);
  });

  it('base power, not current: a 3000 Character at 0 power this turn is still not a candidate', () => {
    const g = game(
      { leader: WB_LEADER, hand: [LINDBERGH, ID], costArea: { active: 8, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [V.c1] },
    );
    play(g, LINDBERGH);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.power(g.find('p2', 'characters', V.c1))).toBe(0);
    play(g, ID);
    expectDecision(g, 'main', 'p1'); // no candidate: nothing to ask
    expect(idsOf(g, 'p2', 'characters')).toEqual([V.c1]);
  });
});
