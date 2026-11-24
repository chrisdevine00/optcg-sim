/** OP11-039 Vagabond Drill. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import {
  canPick,
  counterStep,
  FISH3,
  FISH_LEADER,
  MERFOLK1,
  mk,
  RED_LEADER,
  useCounter,
} from './helpers-op11g2.ts';

const ID = 'OP11-039';
const restedOf = (g: ReturnType<typeof mk>, c: string) =>
  g.card(g.find('p2', 'characters', c)).rested;
/** p2's 9000 Character attacks p1's Leader; the Event is in hand at the Counter Step. */
const under = (characters: string[], p2: string[], leader = FISH_LEADER) =>
  counterStep(
    { leader, hand: [ID], characters, costArea: { active: 3, rested: 0 } },
    { characters: p2 },
  );

describe('OP11-039 Vagabond Drill', () => {
  it('[Counter]: a {Fish-Man} Leader gains +3000 power, then up to 1 opposing Character with cost 3 or less is rested', () => {
    const g = under([], [V.c3, V.c4]);
    useCounter(g, ID);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(true); // cost 3 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(restedOf(g, V.c3)).toBe(true);
    expect(restedOf(g, V.c4)).toBe(false);
  });

  it('only {Fish-Man} or {Merfolk} cards can get the boost (a plain Character cannot); a {Merfolk} Character can', () => {
    const g = under([MERFOLK1, FISH3, V.c2], []);
    useCounter(g, ID);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', MERFOLK1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', FISH3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p1', 'characters', MERFOLK1)]);
    expect(g.power(g.find('p1', 'characters', MERFOLK1))).toBe(3000 + 3000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"Then" is not conditional: with no {Fish-Man}/{Merfolk} card the opposing Character can still be rested', () => {
    const g = under([V.c2], [V.c1], RED_LEADER);
    useCounter(g, ID);
    // No card can be chosen for the boost, so only the rest is asked.
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(restedOf(g, V.c1)).toBe(true);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": may choose no boost target and no Character to rest', () => {
    const g = under([], [V.c1]);
    useCounter(g, ID);
    none(g);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(restedOf(g, V.c1)).toBe(false);
    expectDecision(g, 'counter', 'p1');
  });

  it('[Trigger]: rests up to 1 opposing Character with cost 4 or less (5 is not eligible)', () => {
    const g = mk(
      { life: [ID, V.c1, V.c1] },
      { characters: [V.c4, V.c5] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c4), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(restedOf(g, V.c4)).toBe(true);
    expect(restedOf(g, V.c5)).toBe(false);
  });
});
