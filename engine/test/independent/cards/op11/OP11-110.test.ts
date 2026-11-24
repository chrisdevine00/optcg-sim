/**
 * OP11-110 Fukaboshi (Character, Yellow, cost 3, 5000, no Counter, {Merfolk}/{Fish-Man Island}).
 *
 * Card text: "If this Character would be K.O.'d, you may rest 1 of your [Fish-Man Island] or your
 * [Shirahoshi] Leader instead.
 * [On Play] You may add 1 card from the top or bottom of your Life cards to your hand: K.O. up to 1
 * of your opponent's Characters with a cost of 1 or less."
 *
 * [Fish-Man Island] is OP11-117 (a Stage). Rules: CR 8-3-1-4 (cost), CR 8-4-4 ("up to"), CR 10-3
 * (replacement effects: "instead"; resting needs an active card), CR 7-1 (battle K.O.).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  attack,
  chars,
  cnt,
  hand,
  kind,
  LD11,
  lifeCards,
  mayChooseNone,
  me,
  need,
  no,
  none,
  offeredIds,
  opponentKingdomCome,
  pickInst,
  pickOption,
  playRaw,
  SC11,
  them,
  trash,
  unusable,
  yes,
  KINGDOM_COME,
} from './kit-op11c.ts';

const ID = 'OP11-110';
const STAGE = 'OP11-117';

describe('OP11-110 Fukaboshi [On Play]: add a Life card to my hand to K.O. a cost-1-or-less Character', () => {
  function start(o: { life?: string[]; foe?: string[] } = {}) {
    const g = me(
      LD11.shirahoshi,
      { hand: [ID], life: o.life ?? [SC11.r1, SC11.r2, SC11.r3, SC11.r4] },
      { characters: o.foe ?? [SC11.r1, SC11.r2] },
    );
    playRaw(g, ID);
    return g;
  }

  it('printed effect: take the top Life card, K.O. the chosen cost-1 Character', () => {
    const g = start();
    yes(g, 'p1');
    pickOption(g, 'top');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r1)]);
    expect(hand(g)).toEqual([SC11.r1]);
    expect(lifeCards(g)).toEqual([SC11.r2, SC11.r3, SC11.r4]);
    expect(chars(g, 'p2')).toEqual([SC11.r2]);
    expect(trash(g, 'p2')).toEqual([SC11.r1]);
    expect(kind(g)).toBe('main');
  });

  it('I may take the bottom Life card instead', () => {
    const g = start();
    yes(g, 'p1');
    pickOption(g, 'bottom');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r1)]);
    expect(hand(g)).toEqual([SC11.r4]);
    expect(lifeCards(g)).toEqual([SC11.r1, SC11.r2, SC11.r3]);
  });

  it('K.O. boundary: a cost-1 Character is offered, a cost-2 Character is not', () => {
    const g = start();
    yes(g, 'p1');
    pickOption(g, 'top');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.r1]);
  });

  it('"you may": declining takes no Life card and K.O.s nothing', () => {
    const g = start();
    no(g, 'p1');
    expect(cnt(g, 'p1', 'life')).toBe(4);
    expect(hand(g)).toEqual([]);
    expect(cnt(g, 'p2', 'characters')).toBe(2);
  });

  it('"up to 1": after paying I may K.O. nobody (the Life card stays in my hand)', () => {
    const g = start();
    yes(g, 'p1');
    pickOption(g, 'top');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(hand(g)).toEqual([SC11.r1]);
    expect(cnt(g, 'p2', 'characters')).toBe(2);
  });

  it('unpayable: with no Life cards there is nothing to add', () => {
    const g = start({ life: [] });
    unusable(g, 'p1');
    expect(hand(g)).toEqual([]);
    expect(cnt(g, 'p2', 'characters')).toBe(2);
  });

  it('a single Life card can be added (top and bottom are the same card)', () => {
    const g = start({ life: [SC11.r3] });
    yes(g, 'p1');
    if (
      kind(g) === 'choose' &&
      g.legal().some((a) => a.type === 'pick' && typeof a.choice === 'object')
    ) {
      pickOption(g, 'top');
    }
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r1)]);
    expect(hand(g)).toEqual([SC11.r3]);
    expect(cnt(g, 'p1', 'life')).toBe(0);
  });
});

describe('OP11-110 Fukaboshi: rest my [Fish-Man Island] or [Shirahoshi] Leader instead of being K.O.’d', () => {
  /** p2’s Kingdew (7000) attacks the rested Fukaboshi; stops at the replacement offer. */
  function battle(
    o: {
      leader?: string;
      leaderRested?: boolean;
      stage?: string | { card: string; rested: boolean };
    } = {},
  ) {
    const g = them(
      o.leaderRested
        ? { card: o.leader ?? LD11.shirahoshi, rested: true }
        : (o.leader ?? LD11.shirahoshi),
      { characters: [{ card: ID, rested: true }], ...(o.stage ? { stage: o.stage } : {}) },
      { characters: [SC11.r5] },
    );
    attack(g, at(g, 'p2', 'characters', SC11.r5), at(g, 'p1', 'characters', ID));
    act0(g);
    return g;
  }
  function act0(g: ReturnType<typeof them>) {
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
  }

  it('printed effect: with a [Shirahoshi] Leader, resting it saves Fukaboshi from the K.O.', () => {
    const g = battle();
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(chars(g, 'p1')).toEqual([ID]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(trash(g)).toEqual([]);
  });

  it('with a [Fish-Man Island] Stage I may rest that instead of the Leader', () => {
    const g = battle({ stage: STAGE });
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'stage', STAGE)]);
    expect(chars(g, 'p1')).toEqual([ID]);
    expect(g.card(at(g, 'p1', 'stage', STAGE)).rested).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('"you may": declining lets Fukaboshi be K.O.’d and rests nothing', () => {
    const g = battle();
    no(g, 'p1');
    expect(trash(g)).toEqual([ID]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
  });

  it('a Leader that is not [Shirahoshi] and no Stage: no offer, Fukaboshi is K.O.’d', () => {
    const g = battle({ leader: LD11.plain });
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([ID]);
  });

  it('a [Shirahoshi] Leader that is already rested cannot be rested again: no offer', () => {
    const g = battle({ leaderRested: true });
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([ID]);
  });

  it('a rested [Fish-Man Island] Stage cannot pay either: no offer (plain Leader)', () => {
    const g = battle({ leader: LD11.plain, stage: { card: STAGE, rested: true } });
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([ID]);
  });

  it('a [Fish-Man Island] Stage alone is enough, even with a non-[Shirahoshi] Leader', () => {
    const g = battle({ leader: LD11.plain, stage: STAGE });
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (kind(g) === 'choose') pickInst(g, [at(g, 'p1', 'stage', STAGE)]);
    expect(chars(g, 'p1')).toEqual([ID]);
    expect(g.card(at(g, 'p1', 'stage', STAGE)).rested).toBe(true);
  });

  it('it also covers a K.O. by an opposing effect (Kingdom Come), not only battle', () => {
    const g = them(
      LD11.shirahoshi,
      { characters: [ID] },
      { hand: [KINGDOM_COME], costArea: { active: 10, rested: 0 } },
    );
    opponentKingdomCome(g, at(g, 'p1', 'characters', ID));
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(chars(g, 'p1')).toEqual([ID]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
  });

  it('it protects only Fukaboshi: another of my Characters is K.O.’d normally', () => {
    const g = them(
      LD11.shirahoshi,
      { characters: [{ card: SC11.r2, rested: true }, ID] },
      { characters: [SC11.r5] },
    );
    attack(g, at(g, 'p2', 'characters', SC11.r5), at(g, 'p1', 'characters', SC11.r2));
    act0(g);
    expect(kind(g)).not.toBe('optional');
    expect(trash(g)).toEqual([SC11.r2]);
  });
});
