/** ST16-003 Charlotte Katakuri. */
import { describe, expect, it } from 'vitest';
import { V } from './helpers.ts';
import { FILM_LEADER, mk, PLAIN_PURPLE_LEADER } from './helpers-prbst.ts';

const ID = 'ST16-003';

describe('ST16-003 Charlotte Katakuri', () => {
  const start = (
    leader: string,
    rested: number,
    chars: (string | { card: string; rested: boolean })[] = [ID],
  ) => mk({ leader, characters: chars, costArea: { active: 10 - rested, rested } });
  const power = (g: ReturnType<typeof start>) => g.power(g.find('p1', 'characters', ID));

  it('with a {FILM} Leader and 6 rested cards (boundary) it has +2000 power', () => {
    const g = start(FILM_LEADER, 6);
    expect(power(g)).toBe(6000);
  });

  it('must not fire: 5 rested cards is not enough', () => {
    const g = start(FILM_LEADER, 5);
    expect(power(g)).toBe(4000);
  });

  it('must not fire: without a {FILM} Leader there is no bonus even with many rested cards', () => {
    const g = start(PLAIN_PURPLE_LEADER, 8);
    expect(power(g)).toBe(4000);
  });

  it('rested Characters and the rested Leader count as well as rested DON!!', () => {
    const g = start(FILM_LEADER, 4, [
      ID,
      { card: V.c1, rested: true },
      { card: V.c2, rested: true },
    ]);
    expect(power(g)).toBe(6000); // 4 DON!! + 2 Characters
    const h = start(FILM_LEADER, 4, [ID, { card: V.c1, rested: true }]);
    expect(power(h)).toBe(4000); // 5
    const l = mk({
      leader: { card: FILM_LEADER, rested: true },
      characters: [ID, { card: V.c1, rested: true }],
      costArea: { active: 5, rested: 4 },
    });
    expect(l.power(l.find('p1', 'characters', ID))).toBe(6000); // 4 DON!! + Character + Leader
  });

  it("the opponent's rested cards do not count", () => {
    const g = mk(
      { leader: FILM_LEADER, characters: [ID], costArea: { active: 5, rested: 5 } },
      {
        characters: [
          { card: V.c1, rested: true },
          { card: V.c2, rested: true },
        ],
        costArea: { active: 0, rested: 3 },
      },
    );
    expect(g.power(g.find('p1', 'characters', ID))).toBe(4000);
  });

  it('Katakuri himself counts when rested', () => {
    const g = start(FILM_LEADER, 5, [{ card: ID, rested: true }]);
    expect(power(g)).toBe(6000);
  });
});
