/** EB02-014 Sarfunkel. */
import { describe, expect, it } from 'vitest';
import { C1, canPick, cardsOf, don, expectDecision, hand, mk, pick } from './helpers-aeb2g1.ts';
import { dec, none, play } from './helpers.ts';

const ID = 'EB02-014';
const GAIMON = 'EB02-012'; // cost 1, 1000
const GAIMON_B = 'ST08-003'; // a vanilla [Gaimon], cost 2, 4000
const start = (handCards: string[]) => mk({ hand: handCards, costArea: { active: 4, rested: 0 } });

describe('EB02-014 Sarfunkel', () => {
  it('[On Play]: plays a [Gaimon] from the hand for free', () => {
    const g = start([ID, GAIMON, C1]);
    play(g, ID);
    expect(canPick(g, g.find('p1', 'hand', GAIMON))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', C1))).toBe(false);
    pick(g, [g.find('p1', 'hand', GAIMON)]);
    expect(cardsOf(g, 'p1', 'characters').sort()).toEqual([GAIMON, ID].sort());
    expect(hand(g, 'p1')).toEqual([C1]);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 2 }); // only Sarfunkel's cost 2 was paid
    // The [Gaimon] now has a [Sarfunkel] beside it: [Blocker].
    expect(g.card(g.find('p1', 'characters', GAIMON)).keywords).toContain('Blocker');
  });

  it('any card named [Gaimon] qualifies, whatever its cost or colour', () => {
    const g = start([ID, GAIMON_B]);
    play(g, ID);
    pick(g, [g.find('p1', 'hand', GAIMON_B)]);
    expect(cardsOf(g, 'p1', 'characters')).toContain(GAIMON_B);
  });

  it('"up to 1": may play nothing; only one is played with two in the hand', () => {
    const g = start([ID, GAIMON, GAIMON_B]);
    play(g, ID);
    none(g);
    expect(cardsOf(g, 'p1', 'characters')).toEqual([ID]);
    const h = start([ID, GAIMON, GAIMON_B]);
    play(h, ID);
    pick(h, [h.find('p1', 'hand', GAIMON)]);
    expect(hand(h, 'p1')).toEqual([GAIMON_B]);
    expectDecision(h, 'main', 'p1');
  });

  it('another [Sarfunkel] in the hand is not played (it is not a [Gaimon]), and with no [Gaimon] the pick is asked at max 0', () => {
    const g = start([ID, ID]);
    play(g, ID);
    const d = dec(g);
    expect(d?.kind).toBe('choose');
    expect(d?.max ?? 0).toBe(0);
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    g.act({ type: 'done' });
    expect(hand(g, 'p1')).toEqual([ID]);
  });
});
