/**
 * OP18-023 Gaimon (Green Character, cost 1, 0 power, Counter 2000, {East Blue}).
 *
 * Card text (cards/data):
 *   "[On Play] Up to 1 of your {East Blue} type Leader or Characters gains [Banish] during this turn."
 *
 * Reading: "up to 1" of your {East Blue} Leader or Characters (Gaimon himself qualifies); Banish
 * until end of turn.
 *
 * Scenery: OP03-040 Nami (Blue Leader, {East Blue}), OP03-046 Genzo ({East Blue}, 4000),
 * OP03-035 Momoo ({Animal}/{East Blue}), OP01-023 Marco (no type), ST01-001 Luffy (no East Blue).
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  at,
  atMain,
  endBattle,
  kw,
  LC,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playCard,
  toMyNextMain,
  VC,
} from './kit-c.ts';

const GAIMON = 'OP18-023';

function begin(leader: string, chars: string[] = [], oppChars: string[] = []) {
  const g = mine(leader, { hand: [GAIMON], characters: chars }, { characters: oppChars });
  playCard(g, GAIMON);
  return g;
}

describe('OP18-023 Gaimon: [On Play] an {East Blue} Leader or Character gains Banish this turn', () => {
  it('the {East Blue} Leader can gain Banish', () => {
    const g = begin(LC.namiEB, [VC.genzo2]);
    need(g, 'choose', 'p1');
    pickCards(g, ['OP03-040']);
    expect(atMain(g)).toBe(true);
    expect(kw(g, g.leader('p1'))).toContain('Banish');
    expect(kw(g, at(g, 'p1', 'characters', VC.genzo2))).not.toContain('Banish');
  });

  it('an {East Blue} Character can gain Banish', () => {
    const g = begin(LC.luffy, [VC.genzo2, VC.marco3]);
    pickCards(g, [VC.genzo2]);
    expect(kw(g, at(g, 'p1', 'characters', VC.genzo2))).toContain('Banish');
    expect(kw(g, at(g, 'p1', 'characters', VC.marco3))).not.toContain('Banish');
  });

  it('offers only your {East Blue} Leader and Characters (Gaimon included), no others', () => {
    const g = begin(LC.namiEB, [VC.genzo2, VC.momoo2, VC.marco3, VC.sanji1], [VC.genzo2]);
    expect(offeredIds(g)).toEqual(['OP03-040', VC.genzo2, VC.momoo2, GAIMON].sort());
  });

  it('with a Leader that is not {East Blue} the Leader is not offered', () => {
    const g = begin(LC.luffy, [VC.genzo2]);
    expect(offeredIds(g)).toEqual([VC.genzo2, GAIMON].sort());
  });

  it('Gaimon can give Banish to himself', () => {
    const g = begin(LC.luffy);
    pickCards(g, [GAIMON]);
    expect(kw(g, at(g, 'p1', 'characters', GAIMON))).toContain('Banish');
  });

  it('"up to 1": may choose nobody', () => {
    const g = begin(LC.namiEB, [VC.genzo2]);
    none(g);
    expect(kw(g, g.leader('p1'))).not.toContain('Banish');
  });

  it('Banish is real: the Leader’s hit sends the Life card to the trash', () => {
    const g = begin(LC.namiEB);
    pickCards(g, ['OP03-040']);
    attack(g, g.leader('p1'), g.leader('p2'));
    endBattle(g);
    expect(g.zone('p2', 'trash')).toHaveLength(1);
    expect(g.zone('p2', 'hand')).toHaveLength(0);
  });

  it('Banish ends with the turn', () => {
    const g = begin(LC.namiEB);
    pickCards(g, ['OP03-040']);
    toMyNextMain(g);
    expect(kw(g, g.leader('p1'))).not.toContain('Banish');
  });
});
