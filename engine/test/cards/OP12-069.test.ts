/** OP12-069 Crocodile. */
import { describe, expect, it } from 'vitest';
import { accept, decline, dec, don, expectDecision, passBlock, pick, V } from './helpers.ts';
import { BW_LEADER, NAVY_LEADER, oppAttack } from './helpers-op12g2.ts';

const ID = 'OP12-069';

describe('OP12-069 Crocodile', () => {
  /** p2's 9000 Character attacks p1's Leader; p1 has Crocodile and 3 active DON!!. */
  const attacked = (leader: string = BW_LEADER, p2chars?: string[]) =>
    oppAttack(
      { leader, characters: [ID, V.c1], costArea: { active: 3, rested: 0 } },
      p2chars?.map((c) => c),
    );

  it('DON!! -1: with a {Baroque Works} Leader, the Leader gains +2000 power during this battle', () => {
    const g = attacked();
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
  });

  it('may give the +2000 to a Character instead', () => {
    const g = attacked();
    accept(g);
    pick(g, [g.find('p1', 'characters', ID)]);
    expect(g.power(g.find('p1', 'characters', ID))).toBe(10000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost ends with the battle', () => {
    const g = attacked();
    accept(g);
    pick(g, [g.leader('p1')]);
    passBlock(g);
    while (dec(g)?.kind === 'counter') g.act({ type: 'endCounter' });
    while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
    expectDecision(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining pays no DON!! and boosts nothing', () => {
    const g = attacked();
    decline(g);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Leader without a type including {Baroque Works}: the DON!! is still paid (the "If" follows the colon) and nothing is boosted', () => {
    const g = attacked(NAVY_LEADER);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    expect(don(g, 'p1')).toMatchObject({ active: 2, rested: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(dec(g)?.kind).toBe('block');
  });

  it('with no DON!! on the field the cost cannot be paid', () => {
    const g = oppAttack({ leader: BW_LEADER, characters: [ID] });
    expect(dec(g)?.kind).toBe('block');
  });

  it('once per turn: a second attack in the same turn does not offer it again', () => {
    const g = oppAttack(
      { leader: BW_LEADER, characters: [ID], costArea: { active: 3, rested: 0 } },
      [V.c7, V.c6],
    );
    accept(g);
    pick(g, [g.leader('p1')]);
    passBlock(g);
    while (dec(g)?.kind === 'counter') g.act({ type: 'endCounter' });
    while (dec(g)?.kind === 'trigger') g.act({ type: 'trigger', activate: false });
    expectDecision(g, 'main', 'p2');
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', V.c6),
      target: g.leader('p1'),
    });
    expect(dec(g)?.kind).toBe('block');
  });
});
