/** ST16-001 Uta. */
import { describe, expect, it } from 'vitest';
import { BLUE, dec, don, expectDecision, pick, trash, V } from './helpers.ts';
import { activate, FILM3, FILM5, mk, offeredAb } from './helpers-prbst.ts';

const ID = 'ST16-001';

describe('ST16-001 Uta', () => {
  const start = (p1 = {}) =>
    mk({
      characters: [ID, V.c3],
      hand: [FILM3, V.c1, FILM5],
      costArea: { active: 3, rested: 2 },
      ...p1,
    });
  const uta = (g: ReturnType<typeof start>) => g.find('p1', 'characters', ID);

  it('has [Blocker] (printed)', () => {
    const g = start();
    expect(g.card(uta(g)).keywords).toContain('Blocker');
  });

  it('[Activate: Main] trash 1 {FILM} card from your hand: give up to 1 rested DON!! to your Leader or 1 Character', () => {
    const g = start();
    activate(g, uta(g), 'activate');
    // Only the {FILM} cards are candidates for the cost.
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered.sort()).toEqual(
      [g.find('p1', 'hand', FILM3), g.find('p1', 'hand', FILM5)].sort(),
    );
    pick(g, [g.find('p1', 'hand', FILM3)]);
    expect(trash(g, 'p1')).toEqual([FILM3]);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'characters', V.c3)]);
    expect(g.card(g.find('p1', 'characters', V.c3)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 1, given: 1 });
  });

  it('"up to 1": the DON!! may be left, the card is still trashed', () => {
    const g = start();
    activate(g, uta(g), 'activate');
    pick(g, [g.find('p1', 'hand', FILM5)]);
    g.act({ type: 'done' });
    expect(trash(g, 'p1')).toEqual([FILM5]);
    expect(don(g, 'p1')).toMatchObject({ rested: 2, given: 0 });
  });

  it('Once Per Turn: not offered a second time', () => {
    const g = start();
    activate(g, uta(g), 'activate');
    pick(g, [g.find('p1', 'hand', FILM3)]);
    pick(g, [g.leader('p1')]);
    expect(dec(g)?.kind).toBe('main');
    expect(offeredAb(g, uta(g), 'activate')).toBe(false);
  });

  it('must not be usable with no {FILM} card in hand', () => {
    const g = start({ hand: [V.c1, BLUE] });
    expect(offeredAb(g, uta(g), 'activate')).toBe(false);
  });

  it('with no rested DON!! the cost is paid and nothing is given', () => {
    const g = start({ costArea: { active: 5, rested: 0 } });
    activate(g, uta(g), 'activate');
    pick(g, [g.find('p1', 'hand', FILM3)]);
    expect(dec(g)?.kind).toBe('main');
    expect(trash(g, 'p1')).toEqual([FILM3]);
    expect(don(g, 'p1').given).toBe(0);
  });
});
