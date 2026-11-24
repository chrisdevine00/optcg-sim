/** OP14-025 Kuro. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { cardsIn, EB, EB7, KURO_CHAR, KURO_LEADER, mk, RED_LEADER } from './helpers-op14g1.ts';

const ID = 'OP14-025';
const start = (leader: string, hand: string[] = [EB.c1, EB.c6, EB7, V.c4]) =>
  mk({ leader, hand: [ID, ...hand], costArea: { active: 10, rested: 0 } });

describe('OP14-025 Kuro', () => {
  it('[On Play] with the [Kuro] Leader: plays up to 1 {East Blue} Character with a cost of 6 or less from hand', () => {
    const g = start(KURO_LEADER);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', EB.c1))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', EB.c6))).toBe(true); // cost 6 boundary
    expect(canPick(g, g.find('p1', 'hand', EB7))).toBe(false); // cost 7
    expect(canPick(g, g.find('p1', 'hand', V.c4))).toBe(false); // not {East Blue}
    pick(g, [g.find('p1', 'hand', EB.c6)]);
    expect(cardsIn(g, 'p1', 'characters').sort()).toEqual([ID, EB.c6].sort());
  });

  it('must not fire with a Leader that is not [Kuro] (even an {East Blue} one)', () => {
    const g = start(RED_LEADER);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"up to 1": may play nothing', () => {
    const g = start(KURO_LEADER);
    play(g, ID);
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('a [Kuro] Character on the field is not the Leader: nothing happens', () => {
    const g = mk({ leader: RED_LEADER, characters: [KURO_CHAR], hand: [ID, EB.c1] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
  });

  it('no eligible card in hand: the empty choice is asked and nothing is played', () => {
    const g = start(KURO_LEADER, [V.c4]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    none(g);
    expect(cardsIn(g, 'p1', 'hand')).toEqual([V.c4]);
  });
});
