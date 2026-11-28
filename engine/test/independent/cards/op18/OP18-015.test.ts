/**
 * OP18-015 Eyelashes (Red Character, cost 1, 0 power, Counter 2000, {Animal}/{Alabasta}).
 *
 * Card text (cards/data):
 *   "[On Your Opponent's Attack] You may trash this Character: If your Leader has the {Alabasta}
 *    type, give up to 1 of your opponent's Leader or Characters -3000 power during this turn."
 *
 * Reading: when the opponent declares an attack (any target) you may trash Eyelashes (cost, paid
 * even when the condition then fails); with an {Alabasta} Leader, one opposing Leader or Character
 * gets -3000 until end of turn.
 *
 * Scenery: OP04-001 Vivi (Alabasta Leader 5000), ST01-001 Luffy (no Alabasta), OP02-006 Kingdew
 * (7000 attacker), OP01-023 Marco (5000).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock } from '../../helpers.ts';
import {
  at,
  cardIds,
  endBattle,
  kind,
  LC,
  need,
  no,
  none,
  offeredIds,
  pickInst,
  theirs,
  trash,
  VC,
  yes,
} from './kit-c.ts';

const EYE = 'OP18-015';

function swing(leader: string = LC.vivi, target: 'leader' | 'char' = 'leader') {
  const g = theirs(
    leader,
    { characters: [EYE, { card: VC.sanji1, rested: true }] },
    { characters: [VC.kingdew5, VC.marco3] },
  );
  attack(
    g,
    at(g, 'p2', 'characters', VC.kingdew5),
    target === 'leader' ? g.leader('p1') : at(g, 'p1', 'characters', VC.sanji1),
  );
  return g;
}

describe('OP18-015 Eyelashes: [On Your Opponent’s Attack] trash this: -3000 to an opposing Leader or Character', () => {
  it('asks when the opponent attacks; paying trashes Eyelashes and shrinks the attacker', () => {
    const g = swing();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', VC.kingdew5)]);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(4000);
    expect(trash(g)).toEqual([EYE]);
    endBattle(g);
    // 4000 < 5000 Leader: the attack fails and no Life is lost.
    expect(g.life('p1')).toBe(4);
  });

  it('the choice covers the opposing Leader and Characters, not your own cards', () => {
    const g = swing();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    const offered = g
      .legal()
      .flatMap((a) => (a.type === 'pick' && typeof a.choice === 'string' ? [a.choice] : []));
    expect(offered).toContain(g.leader('p2'));
    expect(offered).toContain(at(g, 'p2', 'characters', VC.marco3));
    expect(offered).toContain(at(g, 'p2', 'characters', VC.kingdew5));
    expect(offered).not.toContain(g.leader('p1'));
    expect(offered).not.toContain(at(g, 'p1', 'characters', VC.sanji1));
    void offeredIds;
  });

  it('the opposing Leader can be the target (5000 -> 2000)', () => {
    const g = swing();
    yes(g, 'p1');
    pickInst(g, [g.leader('p2')]);
    expect(g.power(g.leader('p2'))).toBe(2000);
    endBattle(g);
    expect(g.life('p1')).toBe(3);
  });

  it('declining keeps Eyelashes and changes nothing', () => {
    const g = swing();
    no(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toContain(EYE);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(7000);
    expect(kind(g)).toBe('block');
  });

  it('without an {Alabasta} Leader the trash is still paid but nobody gets -3000', () => {
    const g = swing(LC.luffy);
    yes(g, 'p1');
    expect(trash(g)).toEqual([EYE]);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(7000);
    expect(g.power(g.leader('p2'))).toBe(5000);
    expect(kind(g)).not.toBe('choose');
  });

  it('"up to 1": may give the -3000 to nobody (Eyelashes is still trashed)', () => {
    const g = swing();
    yes(g, 'p1');
    none(g);
    expect(trash(g)).toEqual([EYE]);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(7000);
  });

  it('it also fires when the opponent attacks one of your Characters', () => {
    const g = swing(LC.vivi, 'char');
    yes(g, 'p1');
    pickInst(g, [at(g, 'p2', 'characters', VC.kingdew5)]);
    expect(g.power(at(g, 'p2', 'characters', VC.kingdew5))).toBe(4000);
    passBlock(g);
  });

  it('the -3000 lasts the whole turn (still applied after the battle)', () => {
    const g = swing();
    yes(g, 'p1');
    pickInst(g, [at(g, 'p2', 'characters', VC.marco3)]);
    endBattle(g);
    expect(g.power(at(g, 'p2', 'characters', VC.marco3))).toBe(2000);
  });
});
