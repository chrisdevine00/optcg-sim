/** OP10-008 Scotch. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, pick, play } from './helpers.ts';
import { ids, mk } from './helpers-a10g1.ts';

const ID = 'OP10-008';
const ROCK = 'OP10-017';

describe('OP10-008 Scotch', () => {
  it('printed [Blocker]', () => {
    const g = mk({ characters: [ID] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it('[On Play]: without a [Rock], plays up to 1 [Rock] from your hand (whose own effect does not play another Scotch)', () => {
    const g = mk({ hand: [ID, ROCK] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', ROCK)]);
    expect(ids(g, 'p1', 'characters')).toEqual([ID, ROCK]);
    expect(hand(g, 'p1')).toEqual([]);
    expectDecision(g, 'main', 'p1');
  });

  it('must not play a [Rock] when you already have one', () => {
    const g = mk({ hand: [ID, ROCK], characters: [ROCK] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(ids(g, 'p1', 'characters')).toEqual([ROCK, ID]);
    expect(hand(g, 'p1')).toEqual([ROCK]);
  });

  it('a [Rock] in hand is the only candidate; "up to 1" may play nothing', () => {
    const g = mk({ hand: [ID, ROCK, 'OP01-082'] });
    play(g, ID);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    none(g);
    expect(ids(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('a rested [Rock] still counts as having a [Rock]; a [Rock] in the trash does not', () => {
    const g = mk({ hand: [ID, ROCK], characters: [{ card: ROCK, rested: true }] });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    const h = mk({ hand: [ID, ROCK], trash: [ROCK] });
    play(h, ID);
    expectDecision(h, 'choose', 'p1');
  });
});
