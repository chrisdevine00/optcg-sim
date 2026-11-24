/** OP16-036 Mr.2.Bon.Kurei(Bentham) (Green). */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { mine } from './helpers-op16g2.ts';

const ID = 'OP16-036';

describe('OP16-036 Mr.2.Bon.Kurei(Bentham)', () => {
  it("[On Play] rests up to 1 of your opponent's Characters with a cost of 4 or less", () => {
    const g = mine({ hand: [ID] }, { characters: [V.c4, V.c5] });
    play(g, ID);
    const picks = g.legal().filter((a) => a.type === 'pick');
    expect(picks.map((a) => (a.type === 'pick' ? a.choice : null))).toEqual([
      g.find('p2', 'characters', V.c4),
    ]); // cost 5 is not a candidate
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(true);
    expect(g.card(g.find('p2', 'characters', V.c5)).rested).toBe(false);
  });

  it('"up to 1": may rest none', () => {
    const g = mine({ hand: [ID] }, { characters: [V.c4] });
    play(g, ID);
    none(g);
    expect(g.card(g.find('p2', 'characters', V.c4)).rested).toBe(false);
  });

  const attacker = (don = 0) =>
    mine({ characters: [{ card: ID, don }], costArea: { active: 9, rested: 0 } });
  const attack = (g: ReturnType<typeof attacker>) =>
    g.act({ type: 'attack', attacker: g.find('p1', 'characters', ID), target: g.leader('p2') });

  it("[When Attacking] its base power becomes the same as your opponent's Leader during this turn", () => {
    const g = attacker();
    const mineId = g.find('p1', 'characters', ID);
    expect(g.power(mineId)).toBe(1000);
    attack(g);
    expect(g.power(mineId)).toBe(g.power(g.leader('p2')));
    expect(g.power(mineId)).toBe(5000);
  });

  it('given DON!! still add on top of the new base power', () => {
    const g = attacker(1);
    attack(g);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(6000);
  });

  it('the new base power lasts only this turn', () => {
    const g = attacker();
    attack(g);
    expectDecision(g, 'block', 'p2');
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    while (g.legal().some((a) => a.type === 'trigger')) g.act({ type: 'trigger', activate: false });
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(1000);
  });
});
