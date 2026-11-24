/** OP01-039 Killer. */
import { describe, expect, it } from 'vitest';
import { dec, hand, V } from './helpers.ts';
import { mk } from './helpers-st29old.ts';

const ID = 'OP01-039';

/** p2 attacks p1's Leader with a 4000 Character; p1 blocks with Killer. */
function blockWith(chars: string[], don: number) {
  const g = mk(
    { characters: [{ card: ID, don }, ...chars], costArea: { active: 5, rested: 0 } },
    { characters: [V.c2] },
    { turn: 4, activePlayer: 'p2' },
  );
  g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c2), target: g.leader('p1') });
  g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
  return g;
}

describe('OP01-039 Killer', () => {
  it('[DON!! x1] [On Block]: with 3 or more Characters (himself included), draws 1 card', () => {
    const g = blockWith([V.c1, V.c3], 1);
    expect(hand(g, 'p1')).toHaveLength(1);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });

  it('boundary: with only 2 Characters nothing is drawn', () => {
    const g = blockWith([V.c1], 1);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('must not draw without a DON!! given to him', () => {
    const g = blockWith([V.c1, V.c3], 0);
    expect(hand(g, 'p1')).toHaveLength(0);
  });

  it('draws only 1 with more Characters, and 2 DON!! still satisfies [DON!! x1]', () => {
    const g = blockWith([V.c1, V.c3, V.c4], 2);
    expect(hand(g, 'p1')).toHaveLength(1);
  });

  it('prints [Blocker]: he is a legal blocker, and the draw happens before the counter step', () => {
    const g = blockWith([V.c1, V.c3], 1);
    expect(dec(g)?.kind).toBe('counter');
    expect(hand(g, 'p1')).toHaveLength(1);
  });
});
