/**
 * OP11-013 Prince Grus (Character, Red, cost 1, 2000, Counter +2000, {Navy}/{SWORD}).
 *
 * Card text: "[When Attacking] All of your opponent's Characters with 2000 power or less cannot
 * activate [Blocker] during this turn."
 *
 * Rules: [When Attacking] fires on this card's attack declaration (CR 10-2-2). The power is read as
 * current power; "or less" includes exactly 2000. The restriction lasts the rest of the turn and
 * covers every attack of that turn, not only Grus's.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  gammaKnife,
  blockers,
  chr,
  L11,
  mine,
  N11,
  need,
  noDefence,
  toMyNextMain,
} from './kit-op11a.ts';

const GRUS = 'OP11-013';
/** ST33-001 Koby: Blue, cost 2, 1000, [Blocker]. */
const B1000 = 'ST33-001';
/** OP09-071 Nico Robin: Purple, cost 2, 2000, [Blocker]. */
const B2000 = 'OP09-071';
/** OP07-008 Mr. Tanaka: Red, cost 3, 3000, [Blocker]. */
const B3000 = 'OP07-008';

function board(p2: string[]) {
  return mine(L11.luffy, { characters: [GRUS] }, { characters: p2 });
}

describe('OP11-013 Prince Grus: [When Attacking] small Characters cannot activate [Blocker]', () => {
  it('printed values: cost 1, 2000, Counter +2000', () => {
    const g = board([]);
    const p = chr(g, 'p1', GRUS);
    expect(g.card(p).cost).toBe(1);
    expect(g.power(p)).toBe(2000);
    expect(g.card(p).counter).toBe(2000);
  });

  it('a [Blocker] with exactly 2000 power cannot block (boundary)', () => {
    const g = board([B2000]);
    attack(g, chr(g, 'p1', GRUS), g.leader('p2'));
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([]);
  });

  it('a [Blocker] with 1000 power cannot block', () => {
    const g = board([B1000]);
    attack(g, chr(g, 'p1', GRUS), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('a [Blocker] with 3000 power still can (boundary)', () => {
    const g = board([B3000]);
    attack(g, chr(g, 'p1', GRUS), g.leader('p2'));
    expect(blockers(g)).toEqual([chr(g, 'p2', B3000)]);
  });

  it('affects every matching Character: only the 3000 one is left to block', () => {
    const g = board([B1000, B2000, B3000]);
    attack(g, chr(g, 'p1', GRUS), g.leader('p2'));
    expect(blockers(g)).toEqual([chr(g, 'p2', B3000)]);
  });

  it('without the attack of Grus, the small [Blocker] can block', () => {
    const g = mine(L11.luffy, { characters: [N11.marco] }, { characters: [B2000] });
    attack(g, chr(g, 'p1', N11.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([chr(g, 'p2', B2000)]);
  });

  it('lasts the whole turn: a later attack by another card also meets no small [Blocker]', () => {
    const g = mine(
      L11.luffy,
      { characters: [GRUS, N11.marco] },
      { characters: [B2000, N11.thatch] },
    );
    attack(g, chr(g, 'p1', GRUS), g.leader('p2'));
    noDefence(g);
    need(g, 'main', 'p1');
    attack(g, chr(g, 'p1', N11.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('ends with the turn: next turn the small [Blocker] can block again', () => {
    const g = mine(L11.luffy, { characters: [GRUS, N11.marco] }, { characters: [B2000] });
    attack(g, chr(g, 'p1', GRUS), g.leader('p2'));
    noDefence(g);
    toMyNextMain(g);
    attack(g, chr(g, 'p1', N11.marco), g.leader('p2'));
    expect(blockers(g)).toEqual([chr(g, 'p2', B2000)]);
  });

  it('reads CURRENT power: a 5000 [Blocker] lowered to 0 this turn cannot block', () => {
    const g = mine(
      L11.luffy,
      { hand: ['OP05-077'], characters: [GRUS], costArea: { active: 10, rested: 0 } },
      { characters: ['OP09-072'] },
    );
    gammaKnife(g, chr(g, 'p2', 'OP09-072'));
    need(g, 'main', 'p1');
    expect(g.power(chr(g, 'p2', 'OP09-072'))).toBe(0);
    attack(g, chr(g, 'p1', GRUS), g.leader('p2'));
    expect(blockers(g)).toEqual([]);
  });

  it('applies to an attack on a Character too (rested small [Blocker] cannot block)', () => {
    const g = mine(
      L11.luffy,
      { characters: [GRUS] },
      { characters: [{ card: B2000, rested: true }] },
    );
    expect(at(g, 'p2', 'characters', B2000)).toBeTruthy();
    attack(g, chr(g, 'p1', GRUS), chr(g, 'p2', B2000));
    need(g, 'block', 'p2');
    expect(blockers(g)).toEqual([]);
  });
});
