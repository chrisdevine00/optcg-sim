/** OP17-029 Hongo. */
import { describe, expect, it } from 'vitest';
import { don, none, pick, play, V } from './helpers.ts';
import { mainGame, OTHER_LEADER } from './helpers-op17g2.ts';

const ID = 'OP17-029';

describe('OP17-029 Hongo', () => {
  const start = (rested = 2) =>
    mainGame({ leader: OTHER_LEADER, hand: [ID], costArea: { active: 4, rested } }, [
      V.c1,
      V.c2,
      V.c3,
    ]);

  it('[On Play]: sets up to 1 DON!! as active, then rests up to 2 Characters with a cost of 2 or less', () => {
    const g = start();
    play(g, ID);
    // After paying 4 there are 0 active and 6 rested; the rested DON!! cards are
    // interchangeable, so one is set active without a choice.
    pick(g, [g.find('p2', 'characters', V.c1), g.find('p2', 'characters', V.c2)]);
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 5 });
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
  });

  it('"up to": the DON!! may be left rested and no Character need be rested', () => {
    const g = start();
    play(g, ID);
    if (g.legal().some((a) => a.type === 'pick' && typeof a.choice === 'object')) none(g);
    none(g);
    expect(g.zone('p2', 'characters').some((c) => c.rested)).toBe(false);
  });

  it('"Then" is not "if you do": with no rested DON!! to set active the Characters are still rested', () => {
    const g = mainGame({ leader: OTHER_LEADER, hand: [ID], costArea: { active: 4, rested: 0 } }, [
      V.c1,
    ]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
  });

  it('has [Blocker]', () => {
    const g = start();
    const id = play(g, ID);
    expect(g.card(id).keywords).toContain('Blocker');
  });
});
