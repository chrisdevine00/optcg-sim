/** OP15-091 Margarita. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { donArea, mine, names, OTHER_LEADER } from './helpers-op15g3.ts';

const ID = 'OP15-091';

describe('OP15-091 Margarita', () => {
  const start = (oppTrash: string[], myTrash: string[] = [], oppDeck: string[] = [V.c1, V.c2]) =>
    mine(
      { leader: OTHER_LEADER, hand: [ID], trash: myTrash, ...donArea(1) },
      { trash: oppTrash, deck: oppDeck },
    );

  it("[On Play] places up to 1 card from your opponent's trash at the bottom of its owner's deck", () => {
    const g = start([V.c5, V.c6]);
    play(g, ID);
    pick(g, [g.find('p2', 'trash', V.c6)]);
    expect(names(g, 'p2', 'deck')).toEqual([V.c1, V.c2, V.c6]);
    expect(names(g, 'p2', 'trash')).toEqual([V.c5]);
    expect(names(g, 'p1', 'deck')).not.toContain(V.c6);
  });

  it("only the opponent's trash is a source: your own trash is untouched", () => {
    const g = start([V.c5], [V.c3]);
    play(g, ID);
    expect(
      g.legal().some((a) => a.type === 'pick' && a.choice === g.find('p1', 'trash', V.c3)),
    ).toBe(false);
    pick(g, [g.find('p2', 'trash', V.c5)]);
    expect(names(g, 'p1', 'trash')).toEqual([V.c3]);
  });

  it('"up to 1": choosing none moves nothing', () => {
    const g = start([V.c5]);
    play(g, ID);
    none(g);
    expect(names(g, 'p2', 'trash')).toEqual([V.c5]);
    expect(names(g, 'p2', 'deck')).toEqual([V.c1, V.c2]);
  });

  it('with an empty opposing trash nothing is asked', () => {
    const g = start([]);
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(names(g, 'p1', 'characters')).toEqual([ID]);
  });
});
