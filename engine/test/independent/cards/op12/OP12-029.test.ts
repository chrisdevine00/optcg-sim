/**
 * OP12-029 Shimotsuki Kouzaburou (Character, Green, cost 3, 2000, Counter +2000, {Land of Wano}
 * {East Blue} {Frost Moon Village}).
 *
 * Card text: "[On Play] Rest up to 1 of your opponent's Characters with a cost of 2 or less. Then,
 * K.O. up to 1 of your opponent's rested Characters with a base cost of 1 or less."
 *
 * Rules: the first part uses the current cost, the second the base cost (modifiers ignored); the
 * K.O. looks at the Characters rested at that moment, including one just rested by the first part
 * (CR 8-4-?, sequential effects); "up to 1" may be 0; a K.O. sends the Character to the trash.
 * Whether the second part runs when the first chose nothing is not asserted (no ruling on file),
 * except where the first part had no legal choice and the test says so.
 */
import { describe, expect, it } from 'vitest';
import {
  chr,
  cutAll,
  kind,
  LD12,
  mine,
  need,
  none,
  offeredCardIds,
  pickInst,
  playRaw,
  S12,
  sorted,
} from './kit-op12a.ts';

const SHI = 'OP12-029';

type P = string | { card: string; rested?: boolean };

function board(p2: P[], hand: string[] = []) {
  return mine(LD12.luffy, { hand: [SHI, ...hand] }, { characters: p2 });
}

const rested = (card: string): P => ({ card, rested: true });

describe('OP12-029 Shimotsuki Kouzaburou: [On Play] rest a cost-2-or-less Character, then K.O. a rested base-cost-1-or-less one', () => {
  it('printed values: cost 3, 2000, Counter +2000', () => {
    const g = board([]);
    const c = g.card(g.find('p1', 'hand', SHI));
    expect([c.cost, c.power, c.counter]).toEqual([3, 2000, 2000]);
  });

  it('the rest step offers exactly the opponent Characters with a cost of 2 or less (2 yes, 3 no)', () => {
    const g = board([S12.komachiyo, S12.sai, S12.marco, S12.hajrudin]);
    playRaw(g, SHI);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.komachiyo, S12.sai].sort());
  });

  it('rests the chosen Character; the K.O. step then offers it (rested, base cost 1) and K.O.s it', () => {
    const g = board([S12.komachiyo, S12.marco]);
    playRaw(g, SHI);
    pickInst(g, [chr(g, 'p2', S12.komachiyo)]);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.komachiyo]);
    pickInst(g, [chr(g, 'p2', S12.komachiyo)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([S12.marco]);
    expect(sorted(g, 'p2', 'trash')).toEqual([S12.komachiyo]);
    expect(kind(g)).toBe('main');
  });

  it('a cost-2 Character just rested is not K.O.able (base cost 2 is above 1)', () => {
    const g = board([S12.sai]);
    playRaw(g, SHI);
    pickInst(g, [chr(g, 'p2', S12.sai)]);
    expect(g.card(chr(g, 'p2', S12.sai)).rested).toBe(true);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      none(g);
    }
    expect(sorted(g, 'p2', 'characters')).toEqual([S12.sai]);
  });

  it('the K.O. step offers only rested Characters: an active base-cost-1 Character that was not rested is out', () => {
    const g = board([S12.komachiyo, rested(S12.sunny), S12.sai]);
    playRaw(g, SHI);
    pickInst(g, [chr(g, 'p2', S12.sai)]); // rest Sai (not K.O.able)
    need(g, 'choose', 'p1');
    // rested base-cost-1: Sunny-Kun only; Komachiyo is active
    expect(offeredCardIds(g)).toEqual([S12.sunny]);
  });

  it('an already rested Character of cost 1 can be the rest target and then the K.O. target', () => {
    const g = board([rested(S12.sunny), S12.marco]);
    playRaw(g, SHI);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.sunny]);
    pickInst(g, [chr(g, 'p2', S12.sunny)]);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.sunny]);
    pickInst(g, [chr(g, 'p2', S12.sunny)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([S12.marco]);
  });

  it('"up to 1" on the K.O.: choosing nothing leaves the rested Character on the field', () => {
    const g = board([S12.komachiyo]);
    playRaw(g, SHI);
    pickInst(g, [chr(g, 'p2', S12.komachiyo)]);
    none(g);
    expect(sorted(g, 'p2', 'characters')).toEqual([S12.komachiyo]);
    expect(g.card(chr(g, 'p2', S12.komachiyo)).rested).toBe(true);
  });

  it('only one Character is rested and only one is K.O.d, even with several candidates', () => {
    const g = board([S12.komachiyo, S12.sunny, rested(S12.mohji)]);
    playRaw(g, SHI);
    pickInst(g, [chr(g, 'p2', S12.komachiyo)]);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.komachiyo, S12.mohji].sort());
    pickInst(g, [chr(g, 'p2', S12.mohji)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([S12.komachiyo, S12.sunny].sort());
    expect(g.card(chr(g, 'p2', S12.komachiyo)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S12.sunny)).rested).toBe(false);
  });

  it('the rest step uses the current cost: a cost-3 Character lowered to 2 qualifies, a cost-4 one lowered to 3 does not', () => {
    const g = mine(
      LD12.luffy,
      { hand: [SHI, S12.cutAll] },
      { characters: [S12.marco, S12.hajrudin] },
    );
    cutAll(g);
    playRaw(g, SHI);
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.marco]);
  });

  it('the K.O. step uses the base cost: a rested Navy Character with printed cost 1 (now 3) is K.O.able, a printed 3 (now 5) is not', () => {
    // [Doll] makes her {Navy} Characters +2 cost during my turn: Komille 1 -> 3, Yamakaji 3 -> 5
    const g = board([S12.doll, rested(S12.komille), rested(S12.yamakaji)]);
    expect(g.card(chr(g, 'p2', S12.komille)).cost).toBe(3);
    playRaw(g, SHI);
    // no Character has a current cost of 2 or less, so there is nothing to rest; the K.O. step follows
    need(g, 'choose', 'p1');
    expect(offeredCardIds(g)).toEqual([S12.komille]);
    pickInst(g, [chr(g, 'p2', S12.komille)]);
    expect(sorted(g, 'p2', 'characters')).toEqual([S12.doll, S12.yamakaji].sort());
  });

  it('must not: the Leader is never rested or K.O.d', () => {
    const g = board([]);
    playRaw(g, SHI);
    if (kind(g) === 'choose') {
      expect(offeredCardIds(g)).toEqual([]);
      none(g);
    }
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });
});
