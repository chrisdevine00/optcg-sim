/** OP10-035 Brook. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import { candidates, ids, koByEffect, mk, OPP, plantOpponentEffect } from './helpers-a10g1.ts';

const ID = 'OP10-035';

const koBrook = (p2chars: string[]) => {
  const g = mk({ characters: [ID] }, { characters: p2chars }, OPP);
  koByEffect(g, 'p1', ID);
  return g;
};

describe('OP10-035 Brook', () => {
  it("[On K.O.]: rests up to 1 of your opponent's Characters with a cost of 5 or less", () => {
    const g = koBrook([V.c5, V.c4, V.c6]);
    expectDecision(g, 'choose', 'p1');
    // The Leader (no cost), cost 5 and cost 4 are candidates; cost 6 is not.
    expect(candidates(g)).toHaveLength(3);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
    expect(ids(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('boundary: cost 5 yes, cost 6 no; "up to 1" may rest nothing', () => {
    const g = koBrook([V.c6]);
    expectDecision(g, 'choose', 'p1');
    expect(candidates(g)).toEqual([g.leader('p2')]);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c6)).rested).toBe(false);
  });

  it("can rest the opponent's Leader (the text names Leaders; a Leader has no cost, M6b-Q48)", () => {
    const g = koBrook([V.c6]);
    pick(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).rested).toBe(true);
  });

  it('is K.O.-only: no rest when Brook leaves by being returned to the hand', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, OPP);
    plantOpponentEffect(g, {
      move: {
        what: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
        to: { zone: 'hand' },
      },
    });
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(ids(g, 'p1', 'hand')).toEqual([ID]);
    expectDecision(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'characters', V.c3)).rested).toBe(false);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });
});
