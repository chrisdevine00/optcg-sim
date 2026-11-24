/**
 * OP11-119 Koby (Character, Black, cost 8, 9000, no Counter, {Navy}/{SWORD}).
 *
 * Card text: "[On Play] Up to 1 of your Characters can also attack active Characters during this turn.
 * [When Attacking] You may place 2 cards from your trash at the bottom of your deck in any order:
 * Up to 1 of your Leader or Character cards gains +1000 power until the end of your opponent's
 * next turn."
 *
 * Rules: RL-17 (a grant never lifts summoning sickness), CR 8-3-1-4 ("you may" cost; a public-zone
 * cost that cannot be paid is simply not available), CR 8-4-4 ("up to"), RL-11 (duration).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  canHit,
  deckBottom,
  deckSize,
  kind,
  LD11,
  mayChooseNone,
  me,
  need,
  no,
  noDefence,
  none,
  offeredIds,
  orderFirst,
  pickInst,
  playRaw,
  SC11,
  trash,
  unusable,
  yes,
  zoneIds,
} from './kit-op11c.ts';

const ID = 'OP11-119';

describe('OP11-119 Koby [On Play]: a Character can also attack active Characters', () => {
  function played(o: { mates?: string[] } = {}) {
    const g = me(
      LD11.navy,
      { hand: [ID], characters: o.mates ?? [SC11.navyB3, SC11.r4] },
      { characters: [SC11.r3] },
    );
    playRaw(g, ID);
    return g;
  }

  it('printed effect: offers my Characters (any type), the chosen one can attack the active Character', () => {
    const g = played();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(SC11.r4);
    expect(offeredIds(g)).toContain(SC11.navyB3);
    pickInst(g, [at(g, 'p1', 'characters', SC11.r4)]);
    expect(canHit(g, at(g, 'p1', 'characters', SC11.r4), at(g, 'p2', 'characters', SC11.r3))).toBe(
      true,
    );
    expect(
      canHit(g, at(g, 'p1', 'characters', SC11.navyB3), at(g, 'p2', 'characters', SC11.r3)),
    ).toBe(false);
  });

  it('only Characters are offered, never my Leader', () => {
    const g = played();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).not.toContain(LD11.navy);
  });

  it('"up to 1": granting nobody leaves active Characters untouchable', () => {
    const g = played();
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(canHit(g, at(g, 'p1', 'characters', SC11.r4), at(g, 'p2', 'characters', SC11.r3))).toBe(
      false,
    );
  });

  it('Koby himself may be chosen but still cannot attack this turn (played this turn, RL-17)', () => {
    const g = played();
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', ID)]);
    expect(canHit(g, at(g, 'p1', 'characters', ID), at(g, 'p2', 'characters', SC11.r3))).toBe(
      false,
    );
  });
});

describe('OP11-119 Koby [When Attacking]: bottom 2 trash cards, +1000 power until the end of my opponent’s next turn', () => {
  function attacking(o: { trash?: string[]; p1trash?: string[] } = {}) {
    const g = me(
      LD11.navy,
      {
        characters: [ID, SC11.r3],
        trash: o.trash ?? [SC11.r1, SC11.r2, SC11.r4],
        deck: [SC11.r5, SC11.r6, SC11.r7],
      },
      { characters: [SC11.r2] },
    );
    attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
    return g;
  }

  it('printed effect: pay 2 trash cards to the bottom of my deck, my Leader gains +1000 power', () => {
    const g = attacking();
    yes(g, 'p1');
    const t = zoneIds(g, 'p1', 'trash');
    pickInst(g, [t[0]!, t[1]!]);
    if (kind(g) === 'order') orderFirst(g, 'p1');
    expect(trash(g)).toHaveLength(1);
    expect(deckSize(g)).toBe(5);
    expect(deckBottom(g, 'p1', 2).sort()).toEqual([SC11.r1, SC11.r2].sort());
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('a Character can be chosen instead of the Leader', () => {
    const g = attacking();
    yes(g, 'p1');
    const t = zoneIds(g, 'p1', 'trash');
    pickInst(g, [t[0]!, t[1]!]);
    if (kind(g) === 'order') orderFirst(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([LD11.navy, ID, SC11.r3].sort());
    pickInst(g, [at(g, 'p1', 'characters', SC11.r3)]);
    expect(g.power(at(g, 'p1', 'characters', SC11.r3))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"you may": declining pays nothing and gives no power', () => {
    const g = attacking();
    no(g, 'p1');
    expect(trash(g)).toHaveLength(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('with only 1 card in my trash the cost cannot be paid: nothing happens', () => {
    const g = attacking({ trash: [SC11.r1] });
    unusable(g, 'p1');
    expect(trash(g)).toEqual([SC11.r1]);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('exactly 2 trash cards is enough', () => {
    const g = attacking({ trash: [SC11.r1, SC11.r2] });
    yes(g, 'p1');
    if (kind(g) === 'choose') pickInst(g, zoneIds(g, 'p1', 'trash'));
    if (kind(g) === 'order') orderFirst(g, 'p1');
    expect(trash(g)).toEqual([]);
    expect(deckBottom(g, 'p1', 2).sort()).toEqual([SC11.r1, SC11.r2].sort());
  });

  it('"up to 1": after paying I may still give the power to nobody', () => {
    const g = attacking();
    yes(g, 'p1');
    const t = zoneIds(g, 'p1', 'trash');
    pickInst(g, [t[0]!, t[1]!]);
    if (kind(g) === 'order') orderFirst(g, 'p1');
    need(g, 'choose', 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('duration: the +1000 is still there on my opponent’s turn and gone when it ends', () => {
    const g = attacking();
    yes(g, 'p1');
    const t = zoneIds(g, 'p1', 'trash');
    pickInst(g, [t[0]!, t[1]!]);
    if (kind(g) === 'order') orderFirst(g, 'p1');
    pickInst(g, [g.leader('p1')]);
    noDefence(g);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p2');
    expect(g.power(g.leader('p1'))).toBe(6000);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the bonus also applies in the same battle: a 6000-power attacker meets my +1000 Leader only on their turn (no effect on this attack)', () => {
    const g = attacking();
    yes(g, 'p1');
    const t = zoneIds(g, 'p1', 'trash');
    pickInst(g, [t[0]!, t[1]!]);
    if (kind(g) === 'order') orderFirst(g, 'p1');
    pickInst(g, [at(g, 'p1', 'characters', ID)]);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(10000);
  });
});
