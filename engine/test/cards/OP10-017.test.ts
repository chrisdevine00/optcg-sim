/** OP10-017 Rock. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play } from './helpers.ts';
import { ids, mk } from './helpers-a10g1.ts';

const ID = 'OP10-017';
const SCOTCH = 'OP10-008';

describe('OP10-017 Rock', () => {
  it('[On Play]: without a [Scotch], plays up to 1 [Scotch] from your hand', () => {
    const g = mk({ hand: [ID, SCOTCH] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', SCOTCH)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, SCOTCH]);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });

  it('must not play a [Scotch] when you already have one', () => {
    const g = mk({ hand: [ID, SCOTCH], characters: [SCOTCH] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([SCOTCH, ID]);
    expect(hand(g, 'p1')).toEqual([SCOTCH]);
  });

  it('"up to 1": may play nothing; only [Scotch] is a candidate', () => {
    const g = mk({ hand: [ID, SCOTCH, 'OP01-082'] });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('a [Scotch] in the trash does not count as having one', () => {
    const g = mk({ hand: [ID, SCOTCH], trash: [SCOTCH] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
  });
});
