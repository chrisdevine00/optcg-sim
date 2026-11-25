/** OP09-106 Nico Olvia. */
import { describe, expect, it } from 'vitest';
import {
  canPick,
  dec,
  expectDecision,
  handIds,
  hitWith,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  ROBIN_LEADER,
  V,
} from './helpers-a09g3.ts';

const ID = 'OP09-106';

describe('OP09-106 Nico Olvia', () => {
  const start = (leader: string) => mk({ leader, hand: [ID] }, {}, undefined, 1);

  it('[On Play] a [Nico Robin] Leader gains +3000 power this turn', () => {
    const g = start(ROBIN_LEADER);
    const before = g.power(g.leader('p1'))!;
    play(g, ID);
    if (dec(g)?.kind === 'choose') pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(before + 3000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = start(ROBIN_LEADER);
    const before = g.power(g.leader('p1'))!;
    play(g, ID);
    if (dec(g)?.kind === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(before);
  });

  it('must not be able to target a Leader that is not [Nico Robin], nor a Character', () => {
    const g = mk({ leader: OTHER_LEADER, hand: [ID], characters: [V.c1] }, {}, undefined, 1);
    const before = g.power(g.leader('p1'))!;
    play(g, ID);
    if (dec(g)?.kind === 'choose') {
      expect(canPick(g, g.leader('p1'))).toBe(false);
      expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
      none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(before);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });

  describe('[Trigger]', () => {
    it('with a [Nico Robin] Leader: draw 3 cards and trash 2 cards from your hand', () => {
      const g = hitWith(ID, ROBIN_LEADER, { hand: [V.c2], deck: [V.c3, V.c4, V.c5, V.c6] });
      g.act({ type: 'trigger', activate: true });
      expectDecision(g, 'choose', 'p1');
      pick(g, [g.find('p1', 'hand', V.c2), g.find('p1', 'hand', V.c3)]);
      expect(handIds(g, 'p1')).toEqual([V.c4, V.c5]);
      expect(idsOf(g, 'p1', 'trash')).toEqual(expect.arrayContaining([ID, V.c2, V.c3]));
      expect(idsOf(g, 'p1', 'deck')).toEqual([V.c6]);
    });

    it('must not draw without a [Nico Robin] Leader', () => {
      const g = hitWith(ID, OTHER_LEADER, { hand: [V.c2], deck: [V.c3, V.c4, V.c5] });
      g.act({ type: 'trigger', activate: true });
      expect(handIds(g, 'p1')).toEqual([V.c2]);
      expect(idsOf(g, 'p1', 'deck')).toEqual([V.c3, V.c4, V.c5]);
    });
  });
});
