/**
 * M6b wave 7, G65: "give up to 1 of your currently given DON!! cards to 1 of your Characters"
 * (EB02-009 Thousand Sunny). `moveDon` takes DON!! from a Leader or Character that has some given
 * and gives them to another of your cards; no DON!! changes state and none is gained or lost.
 * Planted on vanilla cards; each test fails with the gap reverted.
 */
import { describe, expect, it } from 'vitest';
import { projectEvents } from '@optcg/engine';
import { withAbilities } from '../../../src/testing.ts';
import {
  BLUE,
  dec,
  don,
  game,
  none,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  pick,
  PURPLE,
  V,
} from '../helpers.ts';
import { errorsOf, main, run } from '../m6b-w1/probe.ts';

const moveDon = (over: object = {}) => ({
  do: {
    moveDon: {
      n: 1,
      from: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
      to: { from: 'characters', owner: 'you', pick: { exactly: 1 } },
      ...over,
    },
  },
});

const mk = (p1: object = {}) => {
  const g = game(
    {
      leader: { card: PLAIN_PURPLE, don: 2 },
      characters: [BLUE, PURPLE, V.c1],
      costArea: { active: 2, rested: 1 },
      ...p1,
    },
    { leader: PLAIN_BLUE },
  );
  g.state = withAbilities(g.state, BLUE, [main([moveDon()] as never)]);
  return g;
};
const given = (g: ReturnType<typeof mk>) => ({
  leader: g.card(g.leader('p1')).don,
  blue: g.card(g.find('p1', 'characters', BLUE)).don,
  purple: g.card(g.find('p1', 'characters', PURPLE)).don,
  c1: g.card(g.find('p1', 'characters', V.c1)).don,
});

describe('G65 move a given DON!! card to another card', () => {
  it('validates, and refuses the nonsense', () => {
    const bad = (over: object) =>
      errorsOf({ id: 'a', kind: 'activate', when: 'activateMain', effect: [moveDon(over)] });
    expect(bad({})).toEqual([]);
    expect(bad({ n: 0 })).not.toEqual([]);
    expect(bad({ n: 1.5 })).not.toEqual([]);
    // Your own Leader and Characters only; the source is one card, the destination exactly one.
    expect(bad({ from: { from: 'stage', owner: 'you', pick: { upTo: 1 } } })).not.toEqual([]);
    expect(bad({ from: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } } })).not.toEqual(
      [],
    );
    expect(bad({ from: { from: 'characters', owner: 'you', pick: { upTo: 2 } } })).not.toEqual([]);
    expect(bad({ to: { from: 'characters', owner: 'you', pick: { upTo: 1 } } })).not.toEqual([]);
    expect(
      bad({ to: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } }),
    ).not.toEqual([]);
  });

  it('takes the DON!! from the Leader that has some, and gives them to the Character chosen', () => {
    const g = mk();
    const before = don(g, 'p1');
    run(g);
    // Only a card with DON!! given can be the source: the Leader alone, so one pick.
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p1', 'characters', PURPLE)]);
    expect(given(g)).toEqual({ leader: 1, blue: 0, purple: 1, c1: 0 });
    // The same DON!! in all: nothing gained, lost or changed in state.
    expect(don(g, 'p1')).toEqual(before);
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
    expect(dec(g)?.kind).toBe('main');
  });

  it('the source is never the destination: a Character’s DON!! go to another Character', () => {
    const g = mk({ characters: [{ card: BLUE, don: 1 }, PURPLE, V.c1], leader: PLAIN_PURPLE });
    run(g);
    // BLUE is the only card with DON!! given.
    pick(g, [g.find('p1', 'characters', BLUE)]);
    const offered = g.legal().filter((a) => a.type === 'pick');
    const ids = offered.map((a) => (a.type === 'pick' ? a.choice : null));
    expect(ids).not.toContain(g.find('p1', 'characters', BLUE));
    expect(ids).toHaveLength(2);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(given(g)).toEqual({ leader: 0, blue: 0, purple: 0, c1: 1 });
  });

  it('"up to 1": nothing chosen, nothing moves', () => {
    const g = mk();
    run(g);
    none(g);
    expect(given(g)).toEqual({ leader: 2, blue: 0, purple: 0, c1: 0 });
    expect(dec(g)?.kind).toBe('main');
  });

  it('with no DON!! given anywhere there is nothing to take, and nothing is asked', () => {
    const g = mk({ leader: PLAIN_PURPLE });
    run(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.eventsOfType('Anomaly')).toHaveLength(0);
    expect(g.eventsOfType('DonMoved')).toHaveLength(0);
  });

  it('asks for the amount it can: a card with fewer DON!! gives what it has', () => {
    const g = mk({ leader: { card: PLAIN_PURPLE, don: 1 } });
    g.state = withAbilities(g.state, BLUE, [main([moveDon({ n: 3 })] as never)]);
    run(g);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p1', 'characters', V.c1)]);
    expect(given(g)).toEqual({ leader: 0, blue: 0, purple: 0, c1: 1 });
  });

  it('both players see the move and which cards it was between', () => {
    const g = mk();
    run(g);
    pick(g, [g.leader('p1')]);
    pick(g, [g.find('p1', 'characters', PURPLE)]);
    for (const viewer of ['p1', 'p2'] as const) {
      const e = projectEvents(g.events, viewer).find((x) => x.type === 'DonMoved')!;
      expect(e.count).toBe(1);
      expect(typeof e.from).toBe('string');
      expect(typeof e.target).toBe('string');
    }
  });
});
