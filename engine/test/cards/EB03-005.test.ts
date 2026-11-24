/** EB03-005 Sugar. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, cardsIn, DP, mk, STRIKE_L, SUGAR_L } from './helpers-eb03g1.ts';

const ID = 'EB03-005';
const start = (leader: string, hand: string[] = [DP.c3, DP.c4, DP.c5, V.c2]) =>
  mk({ leader, hand: [ID, ...hand] });

describe('EB03-005 Sugar', () => {
  it('[On Play] with a [Sugar] Leader: plays up to 1 {Donquixote Pirates} Character with 6000 power or less from hand, rested', () => {
    const g = start(SUGAR_L);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', DP.c3))).toBe(true); // 5000
    expect(canPick(g, g.find('p1', 'hand', DP.c4))).toBe(true); // 6000 boundary
    expect(canPick(g, g.find('p1', 'hand', DP.c5))).toBe(false); // 7000
    expect(canPick(g, g.find('p1', 'hand', V.c2))).toBe(false); // not {Donquixote Pirates}
    pick(g, [g.find('p1', 'hand', DP.c4)]);
    expect(cardsIn(g, 'p1', 'characters').sort()).toEqual([ID, DP.c4].sort());
    expect(g.card(g.find('p1', 'characters', DP.c4)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
  });

  it('must not fire with a Leader that is not [Sugar]', () => {
    const g = start(STRIKE_L);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": may play nothing', () => {
    const g = start(SUGAR_L);
    play(g, ID);
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(cardsIn(g, 'p1', 'hand')).toHaveLength(4);
  });

  it('no eligible card in hand: the empty pick is asked at max 0 (no hidden-zone gate)', () => {
    const g = start(SUGAR_L, [DP.c5, V.c2]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('a [Sugar] Character on the field is not the Leader', () => {
    const g = mk({ leader: STRIKE_L, characters: ['EB05-034'], hand: [ID, DP.c3] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });
});
