/** EB03-015 Camie. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, pick, V } from './helpers.ts';
import { activate, canPick, FISH3, mk, MERFOLK1, STRIKE_L } from './helpers-eb03g1.ts';

const ID = 'EB03-015';
const start = (rested = 2, chars: string[] = [FISH3, MERFOLK1, V.c1]) =>
  mk(
    { leader: STRIKE_L, characters: [ID, ...chars], costArea: { active: 4, rested } },
    { characters: [V.c1, V.c2, V.c3] },
  );

describe('EB03-015 Camie', () => {
  it('rests itself, gives 1 rested DON!! to a {Fish-Man} or {Merfolk} Character, then rests an opponent Character with a cost of 2 or less', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'give-rest');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'characters', FISH3))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', MERFOLK1))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false); // wrong type
    expect(canPick(g, g.leader('p1'))).toBe(false); // Strike Leader: not {Fish-Man}/{Merfolk}
    pick(g, [g.find('p1', 'characters', FISH3)]);
    expect(g.card(g.find('p1', 'characters', FISH3)).don).toBe(1);
    expect(don(g, 'p1')).toMatchObject({ rested: 1 });
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(true); // cost 2 boundary
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // cost 3
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(true);
  });

  it('a {Fish-Man} Leader is a legal target too', () => {
    const g = mk({
      leader: 'OP06-020',
      characters: [ID],
      costArea: { active: 4, rested: 1 },
    });
    activate(g, g.find('p1', 'characters', ID), 'give-rest');
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('"Then" is not "If you do": the rest happens with no rested DON!! to give', () => {
    const g = start(0);
    activate(g, g.find('p1', 'characters', ID), 'give-rest');
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(true);
    expect(g.card(g.find('p1', 'characters', FISH3)).don).toBe(0);
  });

  it('"up to 1" rest: may rest nothing', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'give-rest');
    pick(g, [g.find('p1', 'characters', MERFOLK1)]);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c1)).rested).toBe(false);
  });

  it('"up to 1" DON!!: may give none (Camie is {Merfolk} herself and the only target here); the rest still happens', () => {
    const g = start(2, [V.c1]);
    activate(g, g.find('p1', 'characters', ID), 'give-rest');
    expect(canPick(g, g.find('p1', 'characters', ID))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
    none(g);
    pick(g, [g.find('p2', 'characters', V.c2)]);
    expect(don(g, 'p1')).toMatchObject({ rested: 2 });
    expect(g.card(g.find('p2', 'characters', V.c2)).rested).toBe(true);
  });
});
