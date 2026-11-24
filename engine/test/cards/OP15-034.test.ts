/** OP15-034 Yorki. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { BROOK, mk } from './helpers-op15g1.ts';

const ID = 'OP15-034';
/** [Brook] Leader (OP15-022); its own effect is not scripted. */
const BROOK_LEADER = 'OP15-022';

describe('OP15-034 Yorki', () => {
  it('[On Play]: up to 1 of your [Brook] Characters gains +2000 power this turn', () => {
    const g = mk({ hand: [ID], characters: [BROOK, V.c2] });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [g.find('p1', 'characters', BROOK)]);
    expect(g.power(g.find('p1', 'characters', BROOK))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', V.c2))).toBe(4000);
  });

  it('a [Brook] Leader is a [Brook] card too', () => {
    const g = mk({ leader: BROOK_LEADER, hand: [ID] });
    play(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it("must not offer the opponent's [Brook] or differently named cards", () => {
    const g = mk({ hand: [ID], characters: [V.c2] }, { characters: [BROOK] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(g.power(g.find('p2', 'characters', BROOK))).toBe(5000);
  });

  it('"up to 1": may choose nothing', () => {
    const g = mk({ hand: [ID], characters: [BROOK] });
    play(g, ID);
    none(g);
    expect(g.power(g.find('p1', 'characters', BROOK))).toBe(5000);
  });

  it('the boost lasts this turn only', () => {
    const g = mk({ hand: [ID], characters: [BROOK] });
    play(g, ID);
    pick(g, [g.find('p1', 'characters', BROOK)]);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', BROOK))).toBe(5000);
  });
});
