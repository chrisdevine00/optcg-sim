/**
 * OP11-098 Blue Hole (Event, Black, cost 3, {Navy}).
 *
 * Card text: "[Main] You may trash 3 cards from the top of your deck: K.O. up to 1 of your opponent's
 * Characters with a cost of 2 or less.
 * [Trigger] Up to 1 of your Leader or Character cards gains +1000 power during this turn."
 *
 * Rules: CR 8-3-1-4 ("you may" cost; the deck is a hidden zone, so the question is asked even if the
 * cost could not be paid, with "use" unavailable), CR 8-4-4 ("up to"), RL-26 (a deck of 0 loses, so
 * decks here keep at least 1 card), CR 10-1-5 ([Trigger]).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  chars,
  cnt,
  declineTrigger,
  deckSize,
  hitLeader,
  kind,
  LD11,
  many,
  mayChooseNone,
  me,
  need,
  no,
  none,
  offeredIds,
  pickInst,
  playRaw,
  result,
  SC11,
  them,
  trash,
  unusable,
  yes,
} from './kit-op11c.ts';

const ID = 'OP11-098';

function start(o: { deck?: string[]; foe?: string[] } = {}) {
  const g = me(
    LD11.navy,
    { hand: [ID], deck: o.deck ?? [SC11.r1, SC11.r2, SC11.r3, SC11.r4, SC11.r5] },
    { characters: o.foe ?? [SC11.r2, SC11.r3, SC11.r1] },
  );
  playRaw(g, ID);
  return g;
}

describe('OP11-098 Blue Hole [Main]: trash 3 from my deck, K.O. a Character of cost 2 or less', () => {
  it('printed effect: pay by trashing the top 3, K.O. the chosen cost-2 Character', () => {
    const g = start();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r2)]);
    expect(chars(g, 'p2')).toEqual([SC11.r1, SC11.r3].sort());
    expect(trash(g, 'p2')).toEqual([SC11.r2]);
    expect(trash(g)).toEqual([ID, SC11.r1, SC11.r2, SC11.r3].sort());
    expect(deckSize(g)).toBe(2);
    expect(kind(g)).toBe('main');
  });

  it('K.O. boundary: cost 2 and cost 1 are offered, cost 3 is not', () => {
    const g = start();
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([SC11.r1, SC11.r2].sort());
  });

  it('"you may": declining trashes nothing and K.O.s nothing', () => {
    const g = start();
    no(g, 'p1');
    expect(deckSize(g)).toBe(5);
    expect(cnt(g, 'p2', 'characters')).toBe(3);
    expect(trash(g)).toEqual([ID]);
  });

  it('"up to 1": after paying I may K.O. nobody (the 3 cards stay trashed)', () => {
    const g = start();
    yes(g, 'p1');
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(cnt(g, 'p2', 'characters')).toBe(3);
    expect(deckSize(g)).toBe(2);
  });

  it('unpayable: with only 2 cards in my deck the cost cannot be paid, nothing happens', () => {
    const g = start({ deck: [SC11.r1, SC11.r2] });
    unusable(g, 'p1');
    expect(deckSize(g)).toBe(2);
    expect(cnt(g, 'p2', 'characters')).toBe(3);
  });

  it('a deck of exactly 4 can pay and keeps 1 card', () => {
    const g = start({ deck: [SC11.r1, SC11.r2, SC11.r3, SC11.r4] });
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r1)]);
    expect(deckSize(g)).toBe(1);
  });

  it('RL-26: paying with a deck of exactly 3 empties it and I lose', () => {
    const g = start({ deck: [SC11.r1, SC11.r2, SC11.r3] });
    yes(g, 'p1');
    expect(result(g)).toMatchObject({ winner: 'p2' });
  });

  it('only 1 Character is K.O.’d', () => {
    const g = start();
    yes(g, 'p1');
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(1);
  });

  it('only the opponent’s Characters are targets: my own cost-1 Character is not offered', () => {
    const g = me(LD11.navy, { hand: [ID], characters: [SC11.r1] }, { characters: [SC11.r2] });
    playRaw(g, ID);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.r2]);
  });

  it('with no eligible Character on their side the cost is still a "you may" and nothing is K.O.’d', () => {
    const g = start({ foe: [SC11.r5] });
    if (kind(g) === 'optional') yes(g, 'p1');
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(cnt(g, 'p2', 'characters')).toBe(1);
    expect(kind(g)).toBe('main');
  });
});

describe('OP11-098 Blue Hole [Trigger]: up to 1 Leader or Character +1000 power this turn', () => {
  function hit() {
    const g = them(
      LD11.navy,
      { life: [ID, SC11.r1, SC11.r2], characters: [SC11.r3], deck: many(SC11.r4, 8) },
      {},
    );
    hitLeader(g);
    return g;
  }

  it('printed effect: activating from Life lets me give my Leader +1000 power this turn', () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([LD11.navy, SC11.r3].sort());
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('a Character can take the +1000 instead', () => {
    const g = hit();
    activateTrigger(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', SC11.r3)]);
    expect(g.power(at(g, 'p1', 'characters', SC11.r3))).toBe(6000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": I may give the power to nobody', () => {
    const g = hit();
    activateTrigger(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('declining the [Trigger] gives no power and the card goes to my hand', () => {
    const g = hit();
    declineTrigger(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toContain(ID);
  });

  it('the [Trigger] does not ask for the "trash 3 cards" cost of the [Main] effect', () => {
    const g = hit();
    const before = deckSize(g);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(deckSize(g)).toBe(before);
  });
});
