/** OP12-051 Hina. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, none, pick, trash, V } from './helpers.ts';
import { activate, canActivate, canBlockWith, mine, offered } from './helpers-op12g2.ts';

const ID = 'OP12-051';
const MAYNARD = 'OP05-052'; // {Navy}, cost 2, [Blocker]
const SAUL6 = 'OP12-050'; // {Navy}, base cost 6, [Blocker]

describe('OP12-051 Hina', () => {
  const start = (p2chars: string[] = [MAYNARD, V.c4, V.c5]) =>
    mine({ characters: [ID, V.c5], hand: [V.c1, V.c2] }, { characters: p2chars });

  /** After Hina's lock, p1's active Character attacks p2's Leader; can `blocker` block? */
  const attackAndCheck = (g: ReturnType<typeof start>, blocker: string) => {
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', V.c5),
      target: g.leader('p2'),
    });
    return canBlockWith(g, g.find('p2', 'characters', blocker));
  };

  it('rests Hina and trashes 1 card; the chosen cost 4 or less Character cannot activate [Blocker] this turn', () => {
    const g = start();
    const hina = g.find('p1', 'characters', ID);
    activate(g, hina, 'no-blocker');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p2', 'characters', MAYNARD)]);
    expect(g.card(hina).rested).toBe(true);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(attackAndCheck(g, MAYNARD)).toBe(false);
  });

  it('base cost 4 is the limit: candidates are cost 2 and cost 4, not cost 5', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'no-blocker');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expectDecision(g, 'choose', 'p1');
    const cands = offered(g);
    expect(cands).toContain(g.find('p2', 'characters', MAYNARD));
    expect(cands).toContain(g.find('p2', 'characters', V.c4));
    expect(cands).not.toContain(g.find('p2', 'characters', V.c5));
  });

  it('a [Blocker] of base cost 6 is not a candidate and can still block', () => {
    const g = start([SAUL6, MAYNARD]);
    activate(g, g.find('p1', 'characters', ID), 'no-blocker');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expect(offered(g)).not.toContain(g.find('p2', 'characters', SAUL6));
    pick(g, [g.find('p2', 'characters', MAYNARD)]);
    expect(attackAndCheck(g, SAUL6)).toBe(true);
  });

  it('"up to 1": choosing none leaves every [Blocker] working (the cost is still paid)', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'no-blocker');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    none(g);
    expect(trash(g, 'p1')).toEqual([V.c1]);
    expect(attackAndCheck(g, MAYNARD)).toBe(true);
  });

  it('the lock lasts this turn only', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'no-blocker');
    pick(g, [g.find('p1', 'hand', V.c1)]);
    pick(g, [g.find('p2', 'characters', MAYNARD)]);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    // p1's next turn: the lock has ended.
    expect(dec(g)?.kind).toBe('main');
    expect(attackAndCheck(g, MAYNARD)).toBe(true);
  });

  it('is not offered when Hina is rested or the hand is empty', () => {
    const rested = mine({ characters: [{ card: ID, rested: true }], hand: [V.c1] });
    expect(canActivate(rested, rested.find('p1', 'characters', ID), 'no-blocker')).toBe(false);
    const empty = mine({ characters: [ID], hand: [] });
    expect(canActivate(empty, empty.find('p1', 'characters', ID), 'no-blocker')).toBe(false);
  });
});
