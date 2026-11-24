/** OP13-006 Woop Slap. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, option, pick, play } from './helpers.ts';
import { ACE_CHAR, LUFFY_CHAR, PLAIN_BLUE, mk } from './helpers-op13g1.ts';

const ID = 'OP13-006';

describe('OP13-006 Woop Slap', () => {
  // Woop Slap costs 1, so with 2 rested DON!! to start there are 3 rested after the play.
  const start = (p1 = {}) =>
    mk({ hand: [ID], costArea: { active: 7, rested: 2 }, characters: [LUFFY_CHAR], ...p1 });

  it('[On Play]: asks how many (up to 2), then gives them to 1 of your [Monkey.D.Luffy] cards', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    option(g, '2');
    pick(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ rested: 1, given: 2 });
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('a Luffy Character may take them, and all go to the one card', () => {
    const g = start();
    play(g, ID);
    option(g, '2');
    const luffy = g.find('p1', 'characters', LUFFY_CHAR);
    pick(g, [luffy]);
    expect(g.card(luffy).don).toBe(2);
    expect(g.power(luffy)).toBe(7000);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('"up to 2": 1 or none is allowed', () => {
    const one = start();
    play(one, ID);
    option(one, '1');
    pick(one, [one.leader('p1')]);
    expect(don(one, 'p1')).toMatchObject({ given: 1, rested: 2 });

    const zero = start();
    play(zero, ID);
    option(zero, '0');
    expect(don(zero, 'p1')).toMatchObject({ given: 0, rested: 3 });
    expectDecision(zero, 'main', 'p1');
  });

  it('only [Monkey.D.Luffy] cards are candidates (a [Portgas.D.Ace] Character is not)', () => {
    const g = start({ characters: [LUFFY_CHAR, ACE_CHAR] });
    play(g, ID);
    option(g, '2');
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks.map((a) => (a.type === 'pick' ? a.choice : null)).sort()).toEqual(
      [g.leader('p1'), g.find('p1', 'characters', LUFFY_CHAR)].sort(),
    );
  });

  it('with no [Monkey.D.Luffy] card of yours, no DON!! is given', () => {
    const g = start({ leader: PLAIN_BLUE, characters: [ACE_CHAR] });
    play(g, ID);
    expectDecision(g, 'main', 'p1'); // nothing to give to: nothing is asked
    expect(don(g, 'p1')).toMatchObject({ given: 0 });
    expect(g.card(g.find('p1', 'characters', ACE_CHAR)).don).toBe(0);
  });
});
