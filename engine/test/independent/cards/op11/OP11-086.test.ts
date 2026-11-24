/**
 * OP11-086 Coribou (Character, Black, cost 3, 5000, Counter +1000, {Caribou Pirates}).
 *
 * Card text: "[On Play] Trash 1 card from your hand.
 * [Activate: Main] You may trash this Character: Play up to 1 [Caribou] with a cost of 4 or less
 * from your trash."
 *
 * Scenery: OP01-007 Caribou (Red, cost 3, [On K.O.] only), OP10-104 Caribou (Yellow, cost 4, passive
 * only), OP17-101 Caribou (Yellow, cost 5), OP11-083 Caribou (Black, cost 1, [On Play] trash 2 from
 * hand). All are named [Caribou].
 * Rules: CR 8-3-1-4 (cost), CR 2-4 (name match is exact: [Coribou] is not [Caribou]), CR 8-4-4.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chars,
  hand,
  kind,
  LD11,
  mayChooseNone,
  me,
  need,
  none,
  offeredAbilities,
  offeredIds,
  pickInst,
  playRaw,
  SC11,
  trash,
  useAbility,
} from './kit-op11c.ts';

const ID = 'OP11-086';

describe('OP11-086 Coribou [On Play]: trash 1 card from my hand', () => {
  function play(others: string[]) {
    const g = me(LD11.plain, { hand: [ID, ...others] });
    playRaw(g, ID);
    return g;
  }

  it('printed effect: I choose 1 of 2 cards in hand and trash it', () => {
    const g = play([SC11.r1, SC11.r2]);
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(1);
    expect(d.max).toBe(1);
    pickInst(g, [at(g, 'p1', 'hand', SC11.r2)]);
    expect(trash(g)).toEqual([SC11.r2]);
    expect(hand(g)).toEqual([SC11.r1]);
  });

  it('a single card in hand: it is trashed (with or without a prompt)', () => {
    const g = play([SC11.r1]);
    if (kind(g) === 'choose') pickInst(g, [at(g, 'p1', 'hand', SC11.r1)]);
    expect(trash(g)).toEqual([SC11.r1]);
    expect(kind(g)).toBe('main');
  });

  it('an empty hand: nothing to trash, the game continues', () => {
    const g = play([]);
    expect(trash(g)).toEqual([]);
    expect(kind(g)).toBe('main');
  });
});

describe('OP11-086 Coribou [Activate: Main]: trash it, play a [Caribou] with cost 4 or less from my trash', () => {
  function board(trashCards: string[], extra: Partial<Parameters<typeof me>[1]> = {}) {
    return me(LD11.plain, { characters: [ID], trash: trashCards, ...extra });
  }

  it('printed effect: Coribou goes to the trash and the chosen [Caribou] enters the field', () => {
    const g = board(['OP01-007']);
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', 'OP01-007')]);
    expect(chars(g)).toEqual(['OP01-007']);
    expect(trash(g)).toEqual([ID]);
    expect(kind(g)).toBe('main');
  });

  it('boundary: cost 4 is offered, cost 5 is not, and a different name is not', () => {
    const g = board(['OP10-104', 'OP17-101', SC11.r3, 'OP01-007']);
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual(['OP01-007', 'OP10-104'].sort());
  });

  it('Coribou itself (in the trash after the cost) is not a [Caribou]', () => {
    const g = board([]);
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 1": choosing nothing still pays the cost (Coribou is trashed, nobody enters)', () => {
    const g = board(['OP01-007']);
    useAbility(g, at(g, 'p1', 'characters', ID));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g).sort()).toEqual([ID, 'OP01-007'].sort());
  });

  it('only 1 [Caribou] enters even with several eligible', () => {
    const g = board(['OP10-104', 'OP01-007']);
    useAbility(g, at(g, 'p1', 'characters', ID));
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(1);
    pickInst(g, [at(g, 'p1', 'trash', 'OP10-104')]);
    expect(chars(g)).toEqual(['OP10-104']);
    expect(trash(g).sort()).toEqual([ID, 'OP01-007'].sort());
  });

  it('a [Caribou] in my hand is not a candidate (trash only)', () => {
    const g = board([], { hand: ['OP01-007'] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(hand(g)).toEqual(['OP01-007']);
    expect(chars(g)).toEqual([]);
  });

  it('with a full Character area (5) there is room, because Coribou leaves first', () => {
    const g = me(LD11.plain, {
      characters: [ID, SC11.r1, SC11.r2, SC11.r3, SC11.r4],
      trash: ['OP01-007'],
    });
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', 'OP01-007')]);
    expect(chars(g)).toHaveLength(5);
    expect(chars(g)).toContain('OP01-007');
    expect(trash(g)).toEqual([ID]);
    expect(kind(g)).toBe('main');
  });

  it('the played [Caribou]’s own [On Play] works: OP11-083 makes me trash 2 cards from my hand', () => {
    const g = board([SC11.caribou1], { hand: [SC11.r1, SC11.r2, SC11.r3] });
    useAbility(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', SC11.caribou1)]);
    const d = need(g, 'choose', 'p1');
    expect(d.min).toBe(2);
    pickInst(g, [at(g, 'p1', 'hand', SC11.r1), at(g, 'p1', 'hand', SC11.r2)]);
    expect(hand(g)).toEqual([SC11.r3]);
  });

  it('the ability is not used up: a second Coribou can activate as well', () => {
    const g = me(LD11.plain, { characters: [ID, ID], trash: ['OP01-007', 'OP10-104'] });
    const first = at(g, 'p1', 'characters', ID, 0);
    const second = at(g, 'p1', 'characters', ID, 1);
    useAbility(g, first);
    pickInst(g, [at(g, 'p1', 'trash', 'OP01-007')]);
    expect(offeredAbilities(g, second)).toEqual(['activate']);
  });
});
