/** ST22-007 Squard. */
import { describe, expect, it } from 'vitest';
import { dec, don, expectDecision, pick } from './helpers.ts';
import {
  activateAb,
  at,
  canActivate,
  choices,
  deckOf,
  mk,
  V,
  WB4,
  FORMER3,
} from './helpers-lfb.ts';

const ID = 'ST22-007';

describe('ST22-007 Squard', () => {
  const start = (top: string, rested = 2) =>
    mk({
      characters: [ID, V.c1],
      deck: [top, V.c2, V.c3] as never,
      costArea: { active: 3, rested },
    });
  const use = (g: ReturnType<typeof start>) =>
    activateAb(g, at(g, 'p1', 'characters', ID), 'give-don');

  it('[Activate: Main] [Once Per Turn]: a revealed {Whitebeard Pirates} card: give up to 1 rested DON!! to your Leader or 1 Character', () => {
    const g = start(WB4);
    use(g);
    expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: WB4 });
    expectDecision(g, 'choose', 'p1');
    // The Leader and every Character (Squard himself included).
    expect(choices(g).sort()).toEqual(
      [g.leader('p1'), at(g, 'p1', 'characters', ID), at(g, 'p1', 'characters', V.c1)].sort(),
    );
    pick(g, [at(g, 'p1', 'characters', V.c1)]);
    expect(g.card(at(g, 'p1', 'characters', V.c1)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 1, given: 1 });
    // The revealed card stays on top.
    expect(deckOf(g, 'p1')[0]).toBe(WB4);
  });

  it('a type that includes "Whitebeard Pirates" counts (Former Whitebeard Pirates)', () => {
    const g = start(FORMER3);
    use(g);
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('must not fire: another type is only revealed; no DON!! is given and the Once Per Turn is spent', () => {
    const g = start(V.c4);
    use(g);
    expect(g.eventsOfType('CardRevealed').at(-1)).toMatchObject({ card: V.c4 });
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ rested: 2, given: 0 });
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'give-don')).toBe(false);
  });

  it('with no rested DON!! nothing is given even on a hit', () => {
    const g = start(WB4, 0);
    use(g);
    expect(dec(g)?.kind).toBe('main');
    expect(don(g, 'p1')).toMatchObject({ rested: 0, given: 0 });
  });

  it('is Once Per Turn after a hit', () => {
    const g = start(WB4);
    use(g);
    pick(g, [g.leader('p1')]);
    expect(canActivate(g, at(g, 'p1', 'characters', ID), 'give-don')).toBe(false);
  });
});
