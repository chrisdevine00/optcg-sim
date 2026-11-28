/**
 * OP18-014 Portgas.D.Ace (Red Character, cost 3, 5000, {Alabasta}/{Whitebeard Pirates}).
 *
 * Card text (cards/data):
 *   "[When Attacking] Up to 1 of your {Alabasta} type Characters gains [Rush] during this turn."
 *
 * Reading: on attack, "up to 1" of your {Alabasta} Characters (Ace included) gains Rush until end of
 * turn, so a Character played this turn can attack.
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  at,
  canHit,
  endBattle,
  kw,
  LC,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  VC,
  type Chars,
} from './kit-c.ts';

const ACE = 'OP18-014';

function swing(chars: Chars = []) {
  const g = mine(LC.luffy, { characters: [ACE, ...(chars ?? [])] });
  attack(g, at(g, 'p1', 'characters', ACE), g.leader('p2'));
  return g;
}

describe('OP18-014 Ace: [When Attacking] an {Alabasta} Character gains Rush this turn', () => {
  it('a Character played this turn gains Rush and can attack after the first battle', () => {
    const g = mine(LC.luffy, {
      characters: [ACE, { card: VC.sanji1, playedThisTurn: true }],
    });
    const sanji = at(g, 'p1', 'characters', VC.sanji1);
    expect(canHit(g, sanji, g.leader('p2'))).toBe(false);
    attack(g, at(g, 'p1', 'characters', ACE), g.leader('p2'));
    need(g, 'choose', 'p1');
    pickCards(g, [VC.sanji1]);
    expect(kw(g, sanji)).toContain('Rush');
    endBattle(g);
    expect(canHit(g, sanji, g.leader('p2'))).toBe(true);
  });

  it('only {Alabasta} Characters are offered (Marco is not); Ace itself is', () => {
    const g = swing([VC.marco3, VC.sanji1]);
    expect(offeredIds(g)).toEqual([ACE, VC.sanji1].sort());
  });

  it('"up to 1": may choose nothing and nobody gains Rush', () => {
    const g = mine(LC.luffy, { characters: [ACE, { card: VC.sanji1, playedThisTurn: true }] });
    attack(g, at(g, 'p1', 'characters', ACE), g.leader('p2'));
    none(g);
    endBattle(g);
    expect(canHit(g, at(g, 'p1', 'characters', VC.sanji1), g.leader('p2'))).toBe(false);
  });

  it('only one Character gains Rush when two qualify', () => {
    const g = mine(LC.luffy, {
      characters: [
        ACE,
        { card: VC.sanji1, playedThisTurn: true },
        { card: VC.cobra5, playedThisTurn: true },
      ],
    });
    attack(g, at(g, 'p1', 'characters', ACE), g.leader('p2'));
    pickCards(g, [VC.cobra5]);
    endBattle(g);
    expect(kw(g, at(g, 'p1', 'characters', VC.cobra5))).toContain('Rush');
    expect(kw(g, at(g, 'p1', 'characters', VC.sanji1))).not.toContain('Rush');
  });

  it('Rush is until end of turn only: gone next turn', () => {
    const g = mine(LC.luffy, { characters: [ACE, VC.sanji1] });
    attack(g, at(g, 'p1', 'characters', ACE), g.leader('p2'));
    pickCards(g, [VC.sanji1]);
    endBattle(g);
    expect(kw(g, at(g, 'p1', 'characters', VC.sanji1))).toContain('Rush');
    g.act({ type: 'endTurn' });
    expect(kw(g, at(g, 'p1', 'characters', VC.sanji1))).not.toContain('Rush');
  });

  it('does not fire when Ace is not attacking: no prompt in the Main Phase', () => {
    const g = mine(LC.luffy, { characters: [ACE, VC.sanji1] });
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
  });
});
