/**
 * EB02-014 Sarfunkel (Character, Green, cost 2, 0 power, Counter +1000, {East Blue}).
 *
 * Card text: "[On Play] Play up to 1 [Gaimon] from your hand."
 *
 * Gaimon cards: EB02-012 (cost 1, 1000, [Blocker] while a [Sarfunkel] is on the field), OP03-043
 * (cost 2, 0 power), ST08-003 (cost 2, 4000, vanilla). Rules: "up to" (CR 8-4-4-1); an "up to" pick
 * over the hand with a filter is asked even when nothing matches (no prompt depends on hidden cards).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  canFinish,
  choices,
  choose,
  chooseNone,
  decision,
  donOf,
  E2C,
  E2L,
  kind,
  kw,
  mine,
  need,
  offers,
  playRaw,
} from './kit-eb02a.ts';

const SARF = 'EB02-014';
const GAIMON = 'EB02-012';
const GAIMON_B = 'ST08-003';
const GAIMON_C = 'OP03-043';

function start(handExtra: string[], trash: string[] = [], deck?: string[]) {
  const g = mine(E2L.eastBlue, {
    hand: [SARF, ...handExtra],
    trash,
    ...(deck ? { deck } : {}),
    costArea: { active: 4, rested: 0 },
  });
  playRaw(g, SARF);
  return g;
}

describe('EB02-014 Sarfunkel: [On Play] play up to 1 [Gaimon] from hand', () => {
  it('plays the [Gaimon] from my hand onto the field without paying its cost', () => {
    const g = start([GAIMON]);
    expect(kind(g)).toBe('choose');
    choose(g, [g.find('p1', 'hand', GAIMON)]);
    expect(
      g
        .zone('p1', 'characters')
        .map((c) => c.card)
        .sort(),
    ).toEqual([GAIMON, SARF].sort());
    expect(g.zone('p1', 'hand')).toHaveLength(0);
    // Only Sarfunkel's own cost (2) was paid.
    expect(donOf(g, 'p1').active).toBe(2);
    need(g, 'main', 'p1');
  });

  it('every card named [Gaimon] qualifies, whatever its cost', () => {
    const g = start([GAIMON_B, GAIMON_C]);
    expect(offers(g, g.find('p1', 'hand', GAIMON_B))).toBe(true);
    expect(offers(g, g.find('p1', 'hand', GAIMON_C))).toBe(true);
    choose(g, [g.find('p1', 'hand', GAIMON_B)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(GAIMON_B);
  });

  it('a Character with another name is not offered, even of the same {East Blue} type', () => {
    const g = start([GAIMON, E2C.momoo, E2C.mohji]);
    expect(offers(g, g.find('p1', 'hand', GAIMON))).toBe(true);
    expect(offers(g, g.find('p1', 'hand', E2C.momoo))).toBe(false);
    expect(offers(g, g.find('p1', 'hand', E2C.mohji))).toBe(false);
  });

  it('"up to 1": the [Gaimon] may stay in hand', () => {
    const g = start([GAIMON]);
    expect(canFinish(g)).toBe(true);
    chooseNone(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SARF]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([GAIMON]);
  });

  it('plays only one even when two [Gaimon] are in hand', () => {
    const g = start([GAIMON, GAIMON_B]);
    choose(g, [g.find('p1', 'hand', GAIMON)]);
    // After one pick the effect is over: no second pick is asked.
    need(g, 'main', 'p1');
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([GAIMON_B]);
  });

  it('only cards in hand: a [Gaimon] in the trash or on top of the deck is not offered', () => {
    const g = start([], [GAIMON], [GAIMON_B, ...Array(14).fill(E2C.mohji)]);
    expect(kind(g) === 'choose' ? choices(g) : []).toEqual([]);
    if (canFinish(g)) chooseNone(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SARF]);
  });

  it('the "up to" pick is asked even with no [Gaimon] in hand (no prompt depends on a hidden hand)', () => {
    const g = mine(E2L.eastBlue, { hand: [SARF, E2C.mohji], costArea: { active: 4, rested: 0 } });
    act(g, { type: 'playCard', card: g.find('p1', 'hand', SARF) });
    // Pay the play cost with raw picks while the engine asks for it.
    for (let i = 0; i < 4 && decision(g)?.purpose === 'cost'; i++) {
      const pay = g.legal().find((a) => a.type === 'pick');
      if (!pay) break;
      g.act(pay);
    }
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(d?.max).toBe(0);
    expect(canFinish(g)).toBe(true);
  });

  it('the played [Gaimon] (EB02-012) has [Blocker] at once, since Sarfunkel is now on my field', () => {
    const g = start([GAIMON]);
    choose(g, [g.find('p1', 'hand', GAIMON)]);
    expect(kw(g, g.find('p1', 'characters', GAIMON))).toContain('Blocker');
  });

  it('Sarfunkel itself is played normally: it stays on the field with its cost paid', () => {
    const g = start([GAIMON]);
    chooseNone(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(SARF);
    expect(donOf(g, 'p1').active).toBe(2);
  });
});
