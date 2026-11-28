/** OP18-032 Buggy. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick } from './helpers.ts';
import { buff, candidates, koBy, mine, PLAIN_BLUE, skipRefreshOn, V } from './helpers-op18-g2.ts';

const ID = 'OP18-032';
const theirs = [
  { card: V.c5, rested: true }, // 7000
  { card: V.c6, rested: true }, // 8000
  { card: V.c7, rested: true }, // 9000
  V.c3, // active
];

describe('OP18-032 Buggy', () => {
  it("[On Play] picks one of the opponent's rested Characters with 8000 power or less", () => {
    const g = mine({ hand: [ID] }, { characters: theirs });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g).sort()).toEqual(
      [g.find('p2', 'characters', V.c5), g.find('p2', 'characters', V.c6)].sort(),
    );
    pick(g, [g.find('p2', 'characters', V.c6)]);
    expect(skipRefreshOn(g, g.find('p2', 'characters', V.c6))).toBe(1);
    expect(skipRefreshOn(g, g.find('p2', 'characters', V.c5))).toBe(0);
  });

  it('power is current power: a rested 7000 buffed to 9000 is not offered', () => {
    const g = mine({ hand: [ID] }, { characters: [{ card: V.c5, rested: true }] });
    buff(g, g.find('p2', 'characters', V.c5), 2000);
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(candidates(g)).toEqual([]);
  });

  it('[On K.O.] does the same', () => {
    const g = mine({ characters: [ID] }, { characters: theirs });
    koBy(g, 'p1', ID, 'p2');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(skipRefreshOn(g, g.find('p2', 'characters', V.c5))).toBe(1);
  });

  it('"up to 1": may choose nothing', () => {
    const g = mine({ hand: [ID] }, { characters: theirs });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    none(g);
    expect(skipRefreshOn(g, g.find('p2', 'characters', V.c5))).toBe(0);
  });

  it('an active Character is not a target', () => {
    const g = mine({ hand: [ID] }, { characters: [V.c3] });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    expect(candidates(g)).toEqual([]);
    expect(PLAIN_BLUE).toBeTruthy();
  });
});
