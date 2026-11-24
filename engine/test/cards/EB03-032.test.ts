/** EB03-032 Charlotte Flampe. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { canPick, KATAKURI_CHAR, KATAKURI_L, mk, STRIKE_L } from './helpers-eb03g1.ts';

const ID = 'EB03-032';

describe('EB03-032 Charlotte Flampe', () => {
  it('[On Play]: your [Charlotte Katakuri] Leader gains +2000 power during this turn', () => {
    const g = mk({ leader: KATAKURI_L, hand: [ID], characters: [KATAKURI_CHAR, V.c1] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', KATAKURI_CHAR))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(false);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(g.power(g.find('p1', 'characters', KATAKURI_CHAR))).toBe(3000);
  });

  it('or a [Charlotte Katakuri] Character', () => {
    const g = mk({ leader: KATAKURI_L, hand: [ID], characters: [KATAKURI_CHAR] });
    play(g, ID);
    pick(g, [g.find('p1', 'characters', KATAKURI_CHAR)]);
    expect(g.power(g.find('p1', 'characters', KATAKURI_CHAR))).toBe(5000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost lasts only this turn', () => {
    const g = mk({ leader: KATAKURI_L, hand: [ID] });
    play(g, ID);
    pick(g, [g.leader('p1')]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('must not fire on a Leader or Character with another name: no candidates, nothing changes', () => {
    const g = mk({ leader: STRIKE_L, hand: [ID], characters: [V.c1] });
    play(g, ID);
    expectDecision(g, 'main', 'p1'); // no candidate: nothing is asked
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(g.find('p1', 'characters', V.c1))).toBe(3000);
  });

  it('"up to 1": may boost nothing; the opponent [Charlotte Katakuri] is not a candidate', () => {
    const g = mk({ leader: KATAKURI_L, hand: [ID] }, { leader: KATAKURI_L });
    play(g, ID);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
