/** PRB02-010 Charlotte Pudding. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  dec,
  decline,
  don,
  expectDecision,
  hand,
  none,
  payDon,
  pick,
  play,
  V,
} from './helpers.ts';
import {
  BIGMOM_LEADER,
  BM7,
  BM8,
  BM_C2,
  BM_C4,
  BM_C7,
  cardsIn,
  mk,
  PLAIN_PURPLE_LEADER,
} from './helpers-prbst.ts';

const ID = 'PRB02-010';

describe('PRB02-010 Charlotte Pudding', () => {
  const start = (p1 = {}, p2costs = { active: 6, rested: 0 }) =>
    mk(
      {
        leader: BIGMOM_LEADER,
        hand: [ID, BM_C4, BM8, BM7, BM_C2, BM_C7, V.c4],
        costArea: { active: 10, rested: 0 },
        ...p1,
      },
      { costArea: p2costs },
    );
  /** Play it, pay the optional DON!! -2. */
  const go = (g: ReturnType<typeof start>) => {
    play(g, ID);
    accept(g);
    payDon(g);
  };

  it('[On Play] DON!! -2: with a {Big Mom Pirates} Leader and 6 opponent DON!!, draws 2 then plays a 6000 to 8000 {Big Mom Pirates} Character from hand', () => {
    const g = start();
    go(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 2 });
    expect(hand(g, 'p1')).toHaveLength(8); // 6 others + 2 drawn
    expectDecision(g, 'choose', 'p1');
    // 6000, 7000 and 8000 are in range; 4000 and 9000 are not; a non-{Big Mom Pirates} 6000 is not.
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered.sort()).toEqual(
      [g.find('p1', 'hand', BM_C4), g.find('p1', 'hand', BM8), g.find('p1', 'hand', BM7)].sort(),
    );
    pick(g, [g.find('p1', 'hand', BM8)]);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID, BM8]);
  });

  it('the Character is played for free (not rested, no DON!! paid)', () => {
    const g = start();
    go(g);
    const before = don(g, 'p1');
    pick(g, [g.find('p1', 'hand', BM_C4)]);
    expect(don(g, 'p1')).toEqual(before);
    expect(g.card(g.find('p1', 'characters', BM_C4)).rested).toBe(false);
  });

  it('"up to 1": the play may be skipped (the draw still happened)', () => {
    const g = start();
    go(g);
    none(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g, 'p1')).toHaveLength(8);
  });

  it('boundary: 5 opponent DON!! is not enough: the DON!! is returned and nothing else happens', () => {
    const g = start({}, { active: 5, rested: 0 });
    go(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 2 });
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toHaveLength(6);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('must not fire: with another Leader the DON!! is returned but nothing is drawn or played', () => {
    const g = start({ leader: PLAIN_PURPLE_LEADER });
    go(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 2 });
    expect(dec(g)?.kind).toBe('main');
    expect(hand(g, 'p1')).toHaveLength(6);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('"Then" is inside the guard: with the condition false no card is played even if one is eligible', () => {
    const g = start({ leader: PLAIN_PURPLE_LEADER, hand: [ID, BM_C4, BLUE] });
    go(g);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('the DON!! -2 is optional: declined, nothing happens', () => {
    const g = start();
    play(g, ID);
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ deck: 0 });
    expect(hand(g, 'p1')).toHaveLength(6);
  });
});
