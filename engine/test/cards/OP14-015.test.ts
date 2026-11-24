/** OP14-015 Roronoa Zoro. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, V } from './helpers.ts';
import { attack, finishBattle, mk } from './helpers-op14g1.ts';

const ID = 'OP14-015';

describe('OP14-015 Roronoa Zoro', () => {
  it('[Rush]: can attack the turn it is played', () => {
    const g = mk({ characters: [{ card: ID, playedThisTurn: true }] });
    expect(g.card(g.find('p1', 'characters', ID)).keywords).toContain('Rush');
    expect(
      g.legal().some((a) => a.type === 'attack' && a.attacker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });

  it("[When Attacking]: -1000 to up to 1 of the opponent's Characters this turn", () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3, V.c5] });
    attack(g, g.find('p1', 'characters', ID));
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', V.c3)]);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(4000);
    expect(g.power(g.find('p2', 'characters', V.c5))).toBe(7000);
    finishBattle(g);
  });

  it('"up to 1": may choose nothing', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] });
    attack(g, g.find('p1', 'characters', ID));
    none(g);
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });

  it('the Leader is not a candidate', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] });
    attack(g, g.find('p1', 'characters', ID));
    const choices = g
      .legal()
      .filter((a) => a.type === 'pick')
      .map((a) => (a.type === 'pick' ? a.choice : ''));
    expect(choices).toEqual([g.find('p2', 'characters', V.c3)]);
  });

  it('is only for this turn: the -1000 is gone on the next turn', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] });
    attack(g, g.find('p1', 'characters', ID));
    pick(g, [g.find('p2', 'characters', V.c3)]);
    finishBattle(g);
    g.act({ type: 'endTurn' });
    expect(g.power(g.find('p2', 'characters', V.c3))).toBe(5000);
  });
});
