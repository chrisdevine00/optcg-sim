/** ST30-010 Crocodile. */
import { describe, expect, it } from 'vitest';
import { game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { donArea, offeredPicks, SHC_LEADER } from './helpers-stg1.ts';

const ID = 'ST30-010';

const start = () =>
  game(
    { leader: SHC_LEADER, hand: [ID], ...donArea(6) },
    {
      leader: PLAIN_BLUE,
      characters: [{ card: V.c3, rested: true }, { card: V.c5, rested: true }, V.c1],
    },
  );
const rested = (g: ReturnType<typeof start>, c: string) =>
  g.card(g.find('p2', 'characters', c)).rested;

describe('ST30-010 Crocodile', () => {
  it('has [Blocker]', () => {
    const g = start();
    play(g, ID);
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Blocker');
  });

  it("[On Play]: up to 1 of your opponent's rested Characters will not become active in your opponent's next Refresh Phase", () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    g.act({ type: 'endTurn' });
    // p2's Refresh Phase: the chosen one stays rested, the other rested Character becomes active.
    expect(rested(g, V.c3)).toBe(true);
    expect(rested(g, V.c5)).toBe(false);
  });

  it('only rested Characters are candidates', () => {
    const g = start();
    play(g, ID);
    expect(offeredPicks(g)).toEqual([
      g.find('p2', 'characters', V.c3),
      g.find('p2', 'characters', V.c5),
    ]);
    expect(offeredPicks(g)).not.toContain(g.find('p2', 'characters', V.c1));
    none(g);
  });

  it('"up to 1": choosing none leaves every Character to refresh normally', () => {
    const g = start();
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    expect(rested(g, V.c3)).toBe(false);
    expect(rested(g, V.c5)).toBe(false);
  });

  it('only the next Refresh Phase is skipped: the Character becomes active in the one after', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    g.act({ type: 'endTurn' }); // p1 -> p2
    expect(rested(g, V.c3)).toBe(true);
    g.act({ type: 'endTurn' }); // p2 -> p1
    g.act({ type: 'endTurn' }); // p1 -> p2: second Refresh Phase
    expect(rested(g, V.c3)).toBe(false);
  });
});
