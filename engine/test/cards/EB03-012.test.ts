/** EB03-012 Otama. */
import { describe, expect, it } from 'vitest';
import { don, expectDecision, none, pick } from './helpers.ts';
import { activate, AN4, canPick, mk, offeredAb, SM2, SM3 } from './helpers-eb03g1.ts';

const ID = 'EB03-012';
const SANJI = 'OP04-007'; // {Alabasta}{Straw Hat Crew}, cost 1: neither {Animal} nor {SMILE}
const start = () =>
  mk(
    { characters: [ID] },
    { characters: [SM3, AN4, SM2, SANJI], costArea: { active: 3, rested: 1 } },
  );

describe('EB03-012 Otama', () => {
  it('[Activate: Main] rests this Character as the cost, then rests an opponent {Animal} or {SMILE} Character with a cost of 3 or less', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'rest');
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', SM3))).toBe(true); // cost 3 boundary
    expect(canPick(g, g.find('p2', 'characters', SM2))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', AN4))).toBe(false); // cost 4
    expect(canPick(g, g.find('p2', 'characters', SANJI))).toBe(false); // wrong type
    pick(g, [g.find('p2', 'characters', SM3)]);
    expect(g.card(g.find('p2', 'characters', SM3)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', SM2)).rested).toBe(false);
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 1 });
  });

  it("or rests one of the opponent's active DON!! cards (no cost or type test)", () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'rest');
    const donPick = g
      .legal()
      .find((a) => a.type === 'pick' && typeof a.choice === 'object' && 'from' in a.choice);
    expect(donPick).toBeDefined();
    g.act(donPick!);
    expect(don(g, 'p2')).toMatchObject({ active: 2, rested: 2 });
    for (const c of [SM3, AN4, SM2, SANJI])
      expect(g.card(g.find('p2', 'characters', c)).rested).toBe(false);
  });

  it('"up to 1": may rest nothing, and the cost is still paid', () => {
    const g = start();
    activate(g, g.find('p1', 'characters', ID), 'rest');
    none(g);
    expect(g.card(g.find('p1', 'characters', ID)).rested).toBe(true);
    expect(don(g, 'p2')).toMatchObject({ active: 3, rested: 1 });
  });

  it('a rested Otama cannot activate (the cost needs an active Character)', () => {
    const g = mk({ characters: [{ card: ID, rested: true }] }, { characters: [SM3] });
    expect(offeredAb(g, g.find('p1', 'characters', ID), 'rest')).toBe(false);
  });

  it('your own DON!! and Characters are never candidates', () => {
    const g = mk({ characters: [ID, SM3] }, { characters: [SM2] });
    activate(g, g.find('p1', 'characters', ID), 'rest');
    expect(canPick(g, g.find('p1', 'characters', SM3))).toBe(false);
    expect(canPick(g, g.find('p2', 'characters', SM2))).toBe(true);
  });
});
