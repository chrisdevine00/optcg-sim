/** OP18-015 Eyelashes. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, expectDecision, pick, trash, V } from './helpers.ts';
import { canPick } from './helpers-w3s.ts';
import { oppAttack } from './helpers-op15g2.ts';
import { ALA2, PLAIN_PURPLE, VIVI_L } from './helpers-op18-g1.ts';

const ID = 'OP18-015';
const attacker = (g: ReturnType<typeof oppAttack>) => g.find('p2', 'characters', V.c7);

describe('OP18-015 Eyelashes', () => {
  it("[On Your Opponent's Attack] trash it with an {Alabasta} Leader: the target gets -3000 power", () => {
    const g = oppAttack({ leader: VIVI_L, characters: [ID] });
    expectDecision(g, 'optional', 'p1');
    accept(g);
    pick(g, [attacker(g)]);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(g.power(attacker(g))).toBe(6000);
  });

  it("the target can be the opponent's Leader or a Character, never your own cards", () => {
    const g = oppAttack({ leader: VIVI_L, characters: [ID, ALA2] }, [V.c7, V.c4]);
    accept(g);
    expect(canPick(g, g.leader('p2'))).toBe(true);
    expect(canPick(g, attacker(g))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.leader('p1'))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', ALA2))).toBe(false);
  });

  it('declined: Eyelashes stays and nothing is reduced', () => {
    const g = oppAttack({ leader: VIVI_L, characters: [ID] });
    decline(g);
    expect(trash(g, 'p1')).toEqual([]);
    expect(g.power(attacker(g))).toBe(9000);
  });

  it('with a Leader that is not {Alabasta} the cost is still paid but no power is given', () => {
    const g = oppAttack({ leader: PLAIN_PURPLE, characters: [ID] });
    accept(g);
    expect(trash(g, 'p1')).toEqual([ID]);
    expect(dec(g)?.kind).not.toBe('choose');
    expect(g.power(attacker(g))).toBe(9000);
  });

  it('the -3000 lasts the turn: the 9000 attacker (now 6000) is stopped by a 6000-power Leader', () => {
    const g = oppAttack({ leader: VIVI_L, characters: [ID] });
    accept(g);
    pick(g, [attacker(g)]);
    expect(g.power(attacker(g))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
