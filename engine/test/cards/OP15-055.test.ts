/** OP15-055 Go Ahead and Use 'Em, Mr. Luffy!!!. */
import { describe, expect, it } from 'vitest';
import { expectDecision, hand, none, option, pick, play, V } from './helpers.ts';
import { DRESS2, mine, OTHER_LEADER } from './helpers-op15g2.ts';

const ID = 'OP15-055';

describe("OP15-055 Go Ahead and Use 'Em, Mr. Luffy!!!", () => {
  const modeOf = (g: ReturnType<typeof mine>, n: number) =>
    expectDecision(g, 'choose', 'p1').options![n]!.id;
  const start = () =>
    mine(OTHER_LEADER, { hand: [ID], characters: [DRESS2, V.c2], deck: [V.c1, V.c2, V.c3] });
  const kw = (g: ReturnType<typeof mine>, c: string) =>
    g.card(g.find('p1', 'characters', c)).keywords;

  it('[Main] mode 1: draw 2 cards', () => {
    const g = start();
    play(g, ID);
    option(g, modeOf(g, 0));
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
  });

  it("[Main] mode 2: a {Dressrosa} Character gains [Blocker] until the end of your opponent's next End Phase", () => {
    const g = start();
    play(g, ID);
    option(g, modeOf(g, 1));
    pick(g, [g.find('p1', 'characters', DRESS2)]);
    expect(kw(g, DRESS2)).toContain('Blocker');
    expect(hand(g, 'p1')).toEqual([]);
    g.act({ type: 'endTurn' });
    expect(kw(g, DRESS2)).toContain('Blocker');
    g.act({ type: 'endTurn' });
    expect(kw(g, DRESS2)).not.toContain('Blocker');
  });

  it('only {Dressrosa} Characters are candidates (a non-Dressrosa Character is not)', () => {
    const g = start();
    play(g, ID);
    option(g, modeOf(g, 1));
    const picks = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : null));
    expect(picks).toEqual([g.find('p1', 'characters', DRESS2)]);
  });

  it('"up to 1": mode 2 may be used on nothing', () => {
    const g = start();
    play(g, ID);
    option(g, modeOf(g, 1));
    none(g);
    expect(kw(g, DRESS2)).not.toContain('Blocker');
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('only one mode is applied: mode 1 grants no [Blocker]', () => {
    const g = start();
    play(g, ID);
    option(g, modeOf(g, 0));
    expect(kw(g, DRESS2)).not.toContain('Blocker');
  });
});
