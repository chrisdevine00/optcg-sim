/**
 * OP18-001 Karoo (Leader, Red/Blue, 5000, 4 Life, {Animal}/{Alabasta}).
 *
 * Card text (cards/data):
 *   "All of your Characters with both the {Animal} and {Alabasta} types gain [Rush] and +1000 power.
 *    [Once Per Turn] When your {Alabasta} type Character is K.O.'d, draw 1 card."
 *
 * Reading: the first line is continuous and covers only your own Characters whose types include
 * both {Animal} and {Alabasta}. The second line triggers on the K.O. of any of your {Alabasta}
 * Characters (by battle or effect), at most once per turn (also on the opponent's turn).
 *
 * Scenery: ST01-003 Karoo (Animal+Alabasta, 3000, cost 1), OP04-007 Sanji (Alabasta only, 3000),
 * OP03-035 Momoo (Animal only, Green, 4000), OP13-011 Cobra (Alabasta, 6000), OP02-006 Kingdew
 * (Red, 7000 vanilla attacker), OP01-023 Marco (Red, 5000, no type).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, passBlock } from '../../helpers.ts';
import {
  at,
  atMain,
  canHit,
  cardIds,
  charIds,
  hand,
  kind,
  kw,
  LC,
  mine,
  playCard,
  theirs,
  VC,
  type Chars,
} from './kit-c.ts';

const KAROO = LC.karoo;

describe('OP18-001 Karoo Leader: {Animal}+{Alabasta} Characters gain [Rush] and +1000', () => {
  it('a {Animal}/{Alabasta} Character played this turn has Rush and +1000 and can attack at once', () => {
    const g = mine(KAROO, { hand: [VC.karoo1] });
    playCard(g, VC.karoo1);
    const karoo = at(g, 'p1', 'characters', VC.karoo1);
    expect(kw(g, karoo)).toContain('Rush');
    expect(g.power(karoo)).toBe(4000);
    expect(canHit(g, karoo, g.leader('p2'))).toBe(true);
  });

  it('a Character with only {Alabasta} gets neither Rush nor power', () => {
    const g = mine(KAROO, { hand: [VC.sanji1] });
    playCard(g, VC.sanji1);
    const sanji = at(g, 'p1', 'characters', VC.sanji1);
    expect(kw(g, sanji)).not.toContain('Rush');
    expect(g.power(sanji)).toBe(3000);
    expect(canHit(g, sanji, g.leader('p2'))).toBe(false);
  });

  it('a Character with only {Animal} gets neither Rush nor power', () => {
    const g = mine(KAROO, { characters: [VC.momoo2] });
    const momoo = at(g, 'p1', 'characters', VC.momoo2);
    expect(kw(g, momoo)).not.toContain('Rush');
    expect(g.power(momoo)).toBe(4000);
  });

  it('the opponent’s {Animal}/{Alabasta} Characters are not affected', () => {
    const g = mine(KAROO, {}, { characters: [VC.karoo1] });
    const theirKaroo = at(g, 'p2', 'characters', VC.karoo1);
    expect(g.power(theirKaroo)).toBe(3000);
    expect(kw(g, theirKaroo)).not.toContain('Rush');
  });

  it('without this Leader the same Character has no Rush and no bonus', () => {
    const g = mine(LC.luffy, { hand: [VC.karoo1] });
    playCard(g, VC.karoo1);
    const karoo = at(g, 'p1', 'characters', VC.karoo1);
    expect(g.power(karoo)).toBe(3000);
    expect(canHit(g, karoo, g.leader('p2'))).toBe(false);
  });

  it('the +1000 is real in battle: a 4000 Karoo beats a 4000 attacker target by K.O. (4000 vs 4000)', () => {
    const g = mine(
      KAROO,
      { characters: [VC.karoo1] },
      { characters: [{ card: VC.sai2, rested: true }] },
    );
    const sai = at(g, 'p2', 'characters', VC.sai2);
    attack(g, at(g, 'p1', 'characters', VC.karoo1), sai);
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
  });
});

describe('OP18-001 Karoo Leader: [Once Per Turn] when your {Alabasta} Character is K.O.’d, draw 1', () => {
  function koSetup(chars: Chars, oppChars: string[]) {
    return theirs(KAROO, { characters: chars, hand: [] }, { characters: oppChars });
  }

  it('draws 1 when an {Alabasta} Character is K.O.’d in battle on the opponent’s turn', () => {
    const g = koSetup([{ card: VC.sanji1, rested: true }], [VC.kingdew5]);
    attack(g, at(g, 'p2', 'characters', VC.kingdew5), at(g, 'p1', 'characters', VC.sanji1));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toHaveLength(1);
  });

  it('a K.O.’d Character without {Alabasta} draws nothing', () => {
    const g = koSetup([{ card: VC.marco3, rested: true }], [VC.kingdew5]);
    attack(g, at(g, 'p2', 'characters', VC.kingdew5), at(g, 'p1', 'characters', VC.marco3));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toHaveLength(0);
  });

  it('once per turn: two {Alabasta} Characters K.O.’d in one turn draw only 1', () => {
    const g = koSetup(
      [
        { card: VC.sanji1, rested: true },
        { card: VC.cobra5, rested: true },
      ],
      [VC.kingdew5, VC.thatch6],
    );
    for (const [atk, tgt] of [
      [VC.kingdew5, VC.sanji1],
      [VC.thatch6, VC.cobra5],
    ] as const) {
      attack(g, at(g, 'p2', 'characters', atk), at(g, 'p1', 'characters', tgt));
      passBlock(g);
      if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    }
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toHaveLength(1);
  });

  it('the opponent’s {Alabasta} Character being K.O.’d does not draw for you', () => {
    const g = mine(
      KAROO,
      { characters: [VC.kingdew5], hand: [] },
      { characters: [{ card: VC.sanji1, rested: true }] },
    );
    attack(g, at(g, 'p1', 'characters', VC.kingdew5), at(g, 'p2', 'characters', VC.sanji1));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p2', 'characters')).toEqual([]);
    expect(hand(g)).toHaveLength(0);
  });

  it('[Once Per Turn] resets: a K.O. on a later turn draws again', () => {
    const g = koSetup(
      [
        { card: VC.sanji1, rested: true },
        { card: VC.cobra5, rested: false },
      ],
      [VC.kingdew5, VC.thatch6],
    );
    attack(g, at(g, 'p2', 'characters', VC.kingdew5), at(g, 'p1', 'characters', VC.sanji1));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(hand(g)).toHaveLength(1);
    act(g, { type: 'endTurn' });
    // p1's turn: draw phase +1, then Cobra attacks (so it ends the turn rested) and the turn ends.
    expect(hand(g)).toHaveLength(2);
    attack(g, at(g, 'p1', 'characters', VC.cobra5), g.leader('p2'));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    while (kind(g) === 'trigger') act(g, { type: 'trigger', activate: false });
    act(g, { type: 'endTurn' });
    attack(g, at(g, 'p2', 'characters', VC.thatch6), at(g, 'p1', 'characters', VC.cobra5));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toHaveLength(3);
    expect(charIds(g, 'p1')).toHaveLength(0);
    expect(atMain(g, 'p2')).toBe(true);
  });
});
