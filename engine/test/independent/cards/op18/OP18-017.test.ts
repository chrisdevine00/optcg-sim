/**
 * OP18-017 Roronoa Zoro (Red Character, cost 4, 4000, {Alabasta}/{Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[Once Per Turn] If your {Alabasta} type Character would be removed from the field by your
 *    opponent's effect, you may give your Leader -2000 power during this turn instead.
 *    [When Attacking] Up to 1 of your {Alabasta} type Characters gains [Rush] during this turn."
 *
 * Reading: a replacement for an {Alabasta} Character of yours (Zoro included) that an opposing
 * effect would K.O.; once per turn, optional; the cost is -2000 on your Leader until end of turn.
 * Battle K.O.s are not "by an effect". The opponent here plays OP09-077 Gum-Gum Lightning
 * ("[Main] DON!! -2: K.O. up to 1 of your opponent's Characters with 6000 power or less").
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  at,
  atMain,
  canHit,
  cardIds,
  endBattle,
  kind,
  kw,
  LC,
  lightning,
  mine,
  need,
  no,
  none,
  pickCards,
  playCard,
  theirs,
  VC,
  yes,
  type Chars,
} from './kit-c.ts';

const ZORO = 'OP18-017';
const LDR_PURPLE = 'ST04-001';
const BOLT = 'OP09-077';

function board(chars: Chars, bolts = 1) {
  return theirs(
    LC.luffy,
    { characters: chars },
    { hand: Array(bolts).fill(BOLT), characters: [VC.kingdew5] },
    LDR_PURPLE,
  );
}

describe('OP18-017 Zoro: [Once Per Turn] replace the removal of an {Alabasta} Character with Leader -2000', () => {
  it('yes: the Character stays and your Leader gets -2000 this turn', () => {
    const g = board([ZORO, VC.sanji1]);
    lightning(g, at(g, 'p1', 'characters', VC.sanji1));
    yes(g, 'p1');
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([VC.sanji1, ZORO].sort());
    expect(g.power(g.leader('p1'))).toBe(3000);
  });

  it('no: the Character is K.O.’d and the Leader keeps its power', () => {
    const g = board([ZORO, VC.sanji1]);
    lightning(g, at(g, 'p1', 'characters', VC.sanji1));
    no(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([ZORO]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('Zoro himself ({Alabasta}) can be saved too', () => {
    const g = board([ZORO]);
    lightning(g, at(g, 'p1', 'characters', ZORO));
    yes(g, 'p1');
    expect(cardIds(g, 'p1', 'characters')).toEqual([ZORO]);
    expect(g.power(g.leader('p1'))).toBe(3000);
  });

  it('a Character without {Alabasta} is not protected: no prompt, it is K.O.’d', () => {
    const g = board([ZORO, VC.marco3]);
    lightning(g, at(g, 'p1', 'characters', VC.marco3));
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters')).toEqual([ZORO]);
  });

  it('[Once Per Turn]: a second removal in the same turn is not replaced', () => {
    const g = board([ZORO, VC.sanji1, VC.cobra5], 2);
    lightning(g, at(g, 'p1', 'characters', VC.sanji1));
    yes(g, 'p1');
    lightning(g, at(g, 'p1', 'characters', VC.cobra5));
    expect(kind(g)).not.toBe('optional');
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([VC.sanji1, ZORO].sort());
    expect(g.power(g.leader('p1'))).toBe(3000);
  });

  it('a K.O. in battle is not “by the opponent’s effect”: no prompt', () => {
    const g = board([ZORO, { card: VC.sanji1, rested: true }]);
    attack(g, at(g, 'p2', 'characters', VC.kingdew5), at(g, 'p1', 'characters', VC.sanji1));
    endBattle(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([ZORO]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the -2000 is only for the turn: the Leader is back to 5000 on the next turn', () => {
    const g = board([ZORO, VC.sanji1]);
    lightning(g, at(g, 'p1', 'characters', VC.sanji1));
    yes(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    g.act({ type: 'endTurn' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

describe('OP18-017 Zoro: [When Attacking] an {Alabasta} Character gains Rush this turn', () => {
  it('Zoro attacks and gives Rush to a Character played this turn', () => {
    const g = mine(LC.luffy, { characters: [ZORO, { card: VC.sanji1, playedThisTurn: true }] });
    const sanji = at(g, 'p1', 'characters', VC.sanji1);
    expect(canHit(g, sanji, g.leader('p2'))).toBe(false);
    attack(g, at(g, 'p1', 'characters', ZORO), g.leader('p2'));
    need(g, 'choose', 'p1');
    pickCards(g, [VC.sanji1]);
    endBattle(g);
    expect(kw(g, sanji)).toContain('Rush');
    expect(canHit(g, sanji, g.leader('p2'))).toBe(true);
  });

  it('"up to 1": may choose nobody; non-{Alabasta} Characters are not offered', () => {
    const g = mine(LC.luffy, { characters: [ZORO, { card: VC.marco3, playedThisTurn: true }] });
    attack(g, at(g, 'p1', 'characters', ZORO), g.leader('p2'));
    need(g, 'choose', 'p1');
    expect(
      g.legal().some((a) => a.type === 'pick' && a.choice === at(g, 'p1', 'characters', VC.marco3)),
    ).toBe(false);
    none(g);
    void playCard;
  });
});
