/** ST30-014 Mr.3(Galdino). */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, game, none, option, pick, PLAIN_BLUE } from './helpers.ts';
import {
  ACE6,
  ATMOS,
  canActivate,
  donArea,
  offeredPicks,
  P5000,
  P7000,
  SHC_LEADER,
} from './helpers-stg1.ts';

const ID = 'ST30-014';

const start = (rested: number, others: string[] = [ATMOS, ACE6, P5000, P7000], idRested = false) =>
  game(
    {
      leader: SHC_LEADER,
      characters: [{ card: ID, rested: idRested }, ...others],
      ...donArea(0, rested),
    },
    { leader: PLAIN_BLUE },
  );
const give = (g: ReturnType<typeof start>) =>
  g.act({ type: 'activate', card: g.find('p1', 'characters', ID), ability: 'give' });
const dons = (g: ReturnType<typeof start>, c: string) => g.card(g.find('p1', 'characters', c)).don;

describe('ST30-014 Mr.3(Galdino)', () => {
  it('[Activate: Main] you may rest this Character: gives up to 2 of your Characters with 6000 base power up to 2 rested DON!! each', () => {
    const g = start(4);
    give(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    pick(g, [g.find('p1', 'characters', ATMOS), g.find('p1', 'characters', ACE6)]);
    option(g, '2');
    option(g, '2');
    expect(dons(g, ATMOS)).toBe(2);
    expect(dons(g, ACE6)).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ rested: 0, given: 4 });
  });

  it('only 6000 base power Characters are candidates: not 5000, not 7000, not Mr.3 (3000) or the Leader', () => {
    const g = start(4);
    give(g);
    expect(offeredPicks(g)).toEqual([
      g.find('p1', 'characters', ATMOS),
      g.find('p1', 'characters', ACE6),
    ]);
    none(g);
  });

  it('"up to 2" Characters: one target gets its 2 and the other DON!! stay rested', () => {
    const g = start(4);
    give(g);
    pick(g, [g.find('p1', 'characters', ACE6)]);
    option(g, '2');
    expect(dons(g, ACE6)).toBe(2);
    expect(dons(g, ATMOS)).toBe(0);
    expect(don(g, 'p1')).toMatchObject({ rested: 2, given: 2 });
  });

  it('never more than 2 targets even with 6 rested DON!! and 3 candidates', () => {
    const g = start(6, [ATMOS, ACE6, 'P-022']);
    give(g);
    expect(expectDecision(g, 'choose').max).toBe(2);
    pick(g, [g.find('p1', 'characters', ATMOS), g.find('p1', 'characters', 'P-022')]);
    option(g, '2');
    option(g, '2');
    expect(don(g, 'p1')).toMatchObject({ rested: 2, given: 4 });
    expect(dons(g, ACE6)).toBe(0);
  });

  it('the DON!! on hand do not cap the targets at 2 each: 3 rested DON!! give 2 + 1, 1 rested gives 1', () => {
    const g = start(3);
    give(g);
    expect(expectDecision(g, 'choose').max).toBe(2);
    pick(g, [g.find('p1', 'characters', ATMOS), g.find('p1', 'characters', ACE6)]);
    option(g, '2');
    expect([dons(g, ATMOS), dons(g, ACE6)]).toEqual([2, 1]);
    const one = start(1);
    give(one);
    expect(expectDecision(one, 'choose').max).toBe(1);
    pick(one, [one.find('p1', 'characters', ATMOS)]);
    expect(dons(one, ATMOS)).toBe(1);
  });

  it('cannot be activated while rested (the cost is resting this Character) and the DON!! must be rested ones', () => {
    const rested = start(4, [ATMOS], true);
    expect(canActivate(rested, rested.find('p1', 'characters', ID), 'give')).toBe(false);
    // Active DON!! are not given: with none rested the effect gives nothing.
    const g = game(
      { leader: SHC_LEADER, characters: [ID, ATMOS], ...donArea(3, 0) },
      { leader: PLAIN_BLUE },
    );
    expect(canActivate(g, g.find('p1', 'characters', ID), 'give')).toBe(true);
    give(g);
    expectDecision(g, 'main'); // no rested DON!!: no target is asked, the effect ends
    expect(g.card(g.find('p1', 'characters', ATMOS)).don).toBe(0);
    expect(don(g, 'p1')).toMatchObject({ active: 3, given: 0 });
  });
});
