/**
 * OP13-019 But Ace Here Said You Deserved It!! (Event, Red, cost 1, {Revolutionary Army}/{Dressrosa}).
 *
 * Card text: "[Main] You may rest 4 of your DON!! cards: Give up to 1 of your opponent's Characters
 * -3000 power during this turn. Then, K.O. up to 1 of your opponent's Characters with 3000 power or
 * less. [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3 (the rest-4 cost is paid in full or not at all, after the Event's own cost),
 * CR 8-1-2 ("up to"; the K.O. reads current power after the -3000), "during this battle" ends with
 * the battle. A Character at 0 power or less stays on the field.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  cardIds,
  charsOfIds,
  don,
  kind,
  L13,
  mine,
  need,
  none,
  offeredInsts,
  passBlock,
  passCounter,
  pickInst,
  playRaw,
  theirs,
  trash,
  unusable,
  useCounter,
  V13,
  yes,
  no,
} from './kit-op13a.ts';

const EVENT = 'OP13-019';

function board(p2chars: string[], active = 10) {
  return mine(
    L13.luffy,
    { hand: [EVENT], costArea: { active, rested: 0 } },
    { characters: p2chars },
  );
}
const p2 = (g: ReturnType<typeof board>, card: string, nth = 0) =>
  at(g, 'p2', 'characters', card, nth);

describe('OP13-019 But Ace Here Said You Deserved It!!: [Main] rest 4 DON!!, -3000 then K.O. 3000 or less', () => {
  it('printed values: Event, cost 1', () => {
    const g = board([]);
    const c = g.card(at(g, 'p1', 'hand', EVENT));
    expect(c.cost).toBe(1);
  });

  it('paying: -3000 to a Character, then K.O. of a Character at 3000 or less (the same one, now at 2000)', () => {
    const g = board([V13.marco, V13.kingdew]);
    playRaw(g, EVENT);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(don(g)).toMatchObject({ rested: 5, active: 5 }); // event cost 1 + rest 4
    need(g, 'choose', 'p1');
    pickInst(g, [p2(g, V13.marco)]);
    expect(g.power(p2(g, V13.marco))).toBe(2000);
    need(g, 'choose', 'p1');
    pickInst(g, [p2(g, V13.marco)]);
    expect(charsOfIds(g, 'p2')).toEqual([V13.kingdew]);
    expect(trash(g, 'p2')).toEqual([V13.marco]);
    expect(cardIds(g, 'p1', 'trash')).toEqual([EVENT]);
  });

  it('the K.O. reads power after the -3000: a Character at 4000 (Sai) becomes eligible at 1000', () => {
    const g = board([V13.sai, V13.kingdew]);
    playRaw(g, EVENT);
    yes(g, 'p1');
    pickInst(g, [p2(g, V13.sai)]);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([p2(g, V13.sai)]);
    pickInst(g, [p2(g, V13.sai)]);
    expect(trash(g, 'p2')).toEqual([V13.sai]);
  });

  it('boundary: exactly 3000 power is eligible, 4000 is not (Komachiyo 3000 and Sai 4000, -3000 on Kingdew)', () => {
    const g = board([V13.komachiyo, V13.sai, V13.kingdew]);
    playRaw(g, EVENT);
    yes(g, 'p1');
    pickInst(g, [p2(g, V13.kingdew)]);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([p2(g, V13.komachiyo)]);
    pickInst(g, [p2(g, V13.komachiyo)]);
    expect(charsOfIds(g, 'p2')).toEqual([V13.kingdew, V13.sai].sort());
  });

  it('"up to 1" for the K.O.: it may be skipped; the -3000 stays and nothing is K.O.d', () => {
    const g = board([V13.marco]);
    playRaw(g, EVENT);
    yes(g, 'p1');
    pickInst(g, [p2(g, V13.marco)]);
    need(g, 'choose', 'p1');
    none(g);
    expect(charsOfIds(g, 'p2')).toEqual([V13.marco]);
    expect(g.power(p2(g, V13.marco))).toBe(2000);
  });

  it('K.O.s at most one Character even when two are at 3000 or less', () => {
    const g = board([V13.komachiyo, V13.komachiyo, V13.kingdew]);
    playRaw(g, EVENT);
    yes(g, 'p1');
    pickInst(g, [p2(g, V13.kingdew)]);
    need(g, 'choose', 'p1');
    pickInst(g, [p2(g, V13.komachiyo, 0)]);
    expect(charsOfIds(g, 'p2')).toEqual([V13.komachiyo, V13.kingdew].sort());
  });

  it('declining the "you may": nothing is rested beyond the Event cost, no power change, no K.O.', () => {
    const g = board([V13.cobra0]);
    playRaw(g, EVENT);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(don(g)).toMatchObject({ rested: 1, active: 9 });
    expect(charsOfIds(g, 'p2')).toEqual([V13.cobra0]);
    expect(g.power(p2(g, V13.cobra0))).toBe(0);
  });

  it('cost boundary: 5 active DON!! (1 for the Event + 4 to rest) can pay; 4 cannot', () => {
    const ok = board([V13.cobra0], 5);
    playRaw(ok, EVENT);
    need(ok, 'optional', 'p1');
    expect(ok.legal().some((a) => a.type === 'optional' && a.accept)).toBe(true);
    const short = board([V13.cobra0], 4);
    playRaw(short, EVENT);
    unusable(short, 'p1');
    expect(g_main(short)).toBe(true);
    expect(charsOfIds(short, 'p2')).toEqual([V13.cobra0]);
    expect(short.power(p2(short, V13.cobra0))).toBe(0);
  });

  it('only opposing Characters are offered, for both steps (not their Leader, not mine)', () => {
    const g = mine(
      L13.luffy,
      { hand: [EVENT], characters: [V13.cobra0], costArea: { active: 10, rested: 0 } },
      { characters: [V13.komachiyo] },
    );
    playRaw(g, EVENT);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([p2(g, V13.komachiyo)]);
    none(g);
    need(g, 'choose', 'p1');
    expect(offeredInsts(g)).toEqual([p2(g, V13.komachiyo)]);
    expect(offeredInsts(g)).not.toContain(g.leader('p2'));
  });

  it('[Counter]: my Leader gains +3000 during this battle, which stops an attacker that would have hit', () => {
    const g = theirs(
      L13.luffy,
      { hand: [EVENT], costArea: { active: 5, rested: 0 } },
      { characters: [V13.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', V13.kingdew), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useCounter(g, at(g, 'p1', 'hand', EVENT), g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(don(g)).toMatchObject({ rested: 1, active: 4 }); // only the Event's own cost; no rest-4
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('[Counter]: the +3000 ends with the battle', () => {
    const g = theirs(
      L13.luffy,
      { hand: [EVENT], costArea: { active: 5, rested: 0 } },
      { characters: [V13.kingdew] },
    );
    attack(g, at(g, 'p2', 'characters', V13.kingdew), g.leader('p1'));
    passBlock(g);
    useCounter(g, at(g, 'p1', 'hand', EVENT), g.leader('p1'));
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});

function g_main(g: ReturnType<typeof board>): boolean {
  return kind(g) === 'main';
}
