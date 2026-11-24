/** OP14-070 Buffalo. */
import { describe, expect, it } from 'vitest';
import {
  accept,
  dec,
  decline,
  don,
  expectDecision,
  payDon,
  pick,
  PLAIN_BLUE,
  PURPLE,
  V,
} from './helpers.ts';
import { canBlockWith } from './helpers-op15g2.ts';
import { DP_LEADER, game, plant, plantOn } from './helpers-op14g3.ts';

const ID = 'OP14-070';
const REST_OPP = { rest: { from: 'characters', owner: 'opponent', pick: { exactly: 1 } } };

describe('OP14-070 Buffalo', () => {
  /** p2's turn: Buffalo is p1's only Character, active, p1 has 2 active DON!!. */
  const start = () =>
    game(
      { leader: DP_LEADER, characters: [ID], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
      { turn: 4, activePlayer: 'p2' },
    );

  it("when rested by your opponent's Character's effect: may return 1 DON!!; if you do, set it active", () => {
    const g = start();
    plantOn(g, g.find('p2', 'characters', PURPLE), [{ do: REST_OPP }]);
    accept(g);
    payDon(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(false);
    expect(don(g, 'p1')).toMatchObject({ active: 1, deck: 9 });
  });

  it('declining: the Character stays rested and no DON!! returns', () => {
    const g = start();
    plantOn(g, g.find('p2', 'characters', PURPLE), [{ do: REST_OPP }]);
    decline(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(don(g, 'p1').deck).toBe(8);
  });

  it("an opposing Leader's effect does not trigger it (the source must be a Character)", () => {
    const g = start();
    plant(g, 'p2', REST_OPP);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).not.toBe('optional');
  });

  it('being rested by the attack declaration or a block does not trigger it', () => {
    const g = game(
      { leader: DP_LEADER, characters: [ID], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', PURPLE),
      target: g.leader('p1'),
    });
    expectDecision(g, 'block', 'p1');
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
    g.act({ type: 'block', blocker: g.find('p1', 'characters', ID) });
    expect(dec(g)?.kind).not.toBe('optional');
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('your own effect resting it does not trigger it', () => {
    const g = game(
      { leader: DP_LEADER, characters: [ID], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    plant(g, 'p1', { rest: { from: 'characters', owner: 'you' } });
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).not.toBe('optional');
  });

  it("your own Character's effect resting it does not trigger it (the source must be an OPPOSING Character)", () => {
    const g = game(
      { leader: DP_LEADER, characters: [ID, V.c1], costArea: { active: 2, rested: 0 } },
      { leader: PLAIN_BLUE },
    );
    plantOn(g, g.find('p1', 'characters', V.c1), [
      { do: { rest: { from: 'characters', owner: 'you', pick: { exactly: 1 } } } },
    ]);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(dec(g)?.kind).not.toBe('optional');
    expect(don(g, 'p1').deck).toBe(8);
  });

  it('with no DON!! on your field the DON!! cannot be returned and it stays rested', () => {
    const g = game(
      { leader: DP_LEADER, characters: [ID], costArea: { active: 0, rested: 0 } },
      { leader: PLAIN_BLUE, characters: [PURPLE] },
      { turn: 4, activePlayer: 'p2' },
    );
    plantOn(g, g.find('p2', 'characters', PURPLE), [{ do: REST_OPP }]);
    if (dec(g)?.kind === 'optional') accept(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
  });
});
