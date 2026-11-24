/**
 * OP14-120 Crocodile (Character, Black, cost 8, 10000, no Counter, {Baroque Works}/{The Seven
 * Warlords of the Sea}).
 *
 * Card text: "[On Play] Up to 1 of your opponent's Characters with a cost of 9 or less cannot attack until
 * the end of your opponent's next End Phase. Then, if your opponent has a Character with a cost of 0
 * or with a cost of 8 or more, draw 1 card.
 * [On K.O.] You may trash 1 card from your hand: Play this Character card from your trash."
 *
 * Rules: CR 10-2-6 ([On Play]), CR 10-2-17 ([On K.O.] resolves from the trash), CR 8-3-1 (costs),
 * RD 122 ("Then, if" has its own condition). Cost 0 is made with OP17-097 (every opposing Character
 * -1 cost this turn): a cost-1 Mohji.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  attackers,
  BLUE,
  chars,
  deckTop,
  hand,
  kind,
  LD14,
  makeCostZero,
  mine,
  need,
  no,
  none,
  offeredIds,
  payHand,
  pickCards,
  playId,
  SC14,
  skipEmptyChoose,
  theirs,
  toMyNextMain,
  trash,
  offeredUnpayable,
  yes,
  passBlock,
} from './kit-op14d.ts';

const ID = 'OP14-120';

function played(o: { theirs?: string[]; mine?: string[]; hand?: string[]; deck?: string[] } = {}) {
  const g = mine(
    LD14.bw,
    { hand: [ID, ...(o.hand ?? [])], characters: o.mine ?? [], deck: o.deck ?? deckTop([SC14.c4]) },
    { characters: o.theirs ?? [SC14.c8, SC14.c5] },
  );
  playId(g, ID);
  return g;
}

describe('OP14-120 Crocodile: [On Play] an opposing Character with cost 9 or less cannot attack', () => {
  it('offers the opposing Characters with cost 9 or less (cost 9 in, cost 10 out)', () => {
    const g = played({ theirs: [SC14.c9, SC14.c10, SC14.c5] });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c5, SC14.c9].sort());
  });

  it("the chosen Character cannot attack in the opponent's next turn; the others can", () => {
    const g = played({ theirs: [SC14.c5, SC14.c4] });
    pickCards(g, [SC14.c5]);
    g.act({ type: 'endTurn' });
    expect(atMain(g, 'p2')).toBe(true);
    expect(attackers(g)).not.toContain(g.find('p2', 'characters', SC14.c5));
    expect(attackers(g)).toContain(g.find('p2', 'characters', SC14.c4));
  });

  it('the restriction ends with that End Phase: the Character attacks again the turn after', () => {
    const g = played({ theirs: [SC14.c5] });
    pickCards(g, [SC14.c5]);
    toMyNextMain(g);
    g.act({ type: 'endTurn' });
    expect(attackers(g)).toContain(g.find('p2', 'characters', SC14.c5));
  });

  it('"up to 1": may choose nobody', () => {
    const g = played({ theirs: [SC14.c5] });
    need(g, 'choose', 'p1');
    none(g);
    g.act({ type: 'endTurn' });
    expect(attackers(g)).toContain(g.find('p2', 'characters', SC14.c5));
  });
});

describe('OP14-120 Crocodile: "Then, if your opponent has a Character with cost 0 or 8+, draw 1"', () => {
  it('an opposing cost-8 Character: draws exactly 1', () => {
    const g = played({ theirs: [SC14.c8] });
    need(g, 'choose', 'p1');
    none(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC14.c4]);
  });

  it('boundary: only cost-7 opposing Characters: nothing is drawn', () => {
    const g = played({ theirs: [SC14.c7] });
    none(g);
    expect(hand(g)).toEqual([]);
  });

  it('an opposing Character of cost 0 also counts', () => {
    const g = mine(
      LD14.bw,
      { hand: [ID, SC14.shrink], deck: deckTop([SC14.c4]) },
      { characters: [SC14.c1] },
    );
    makeCostZero(g, g.find('p2', 'characters', SC14.c1));
    playId(g, ID);
    none(g);
    expect(hand(g)).toEqual([SC14.c4]);
  });

  it("only the OPPONENT's Characters count: my own cost-8 Character does not draw", () => {
    const g = played({ theirs: [SC14.c5], mine: [SC14.c8] });
    none(g);
    expect(hand(g)).toEqual([]);
  });

  it('the draw does not depend on the lock having a target: with only a cost-10 opposing Character it still draws', () => {
    const g = played({ theirs: [SC14.c10] });
    skipEmptyChoose(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SC14.c4]);
  });
});

describe('OP14-120 Crocodile: [On K.O.] you may trash 1 card from your hand: play this Character from your trash', () => {
  function koed(o: { hand?: string[]; trash?: string[] } = {}) {
    const g = theirs(
      LD14.bw,
      {
        characters: [{ card: ID, rested: true }],
        hand: o.hand ?? [SC14.c2, SC14.c4],
        trash: o.trash ?? [],
        deck: deckTop([SC14.c6]),
      },
      { characters: [SC14.c10] },
    );
    attack(g, g.find('p2', 'characters', SC14.c10), at(g, 'p1', 'characters', ID));
    passBlock(g);
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    return g;
  }

  it('paying the cost plays it from the trash, active, without paying its cost 8 (no DON!! active)', () => {
    const g = koed();
    need(g, 'optional', 'p1');
    yes(g);
    payHand(g, [SC14.c2]);
    const c = g.zone('p1', 'characters');
    expect(c.map((x) => x.card)).toEqual([ID]);
    expect(c[0]!.rested).toBe(false);
    expect(trash(g)).toEqual([SC14.c2]);
  });

  it('being played again, its [On Play] fires again: the opposing cost-10 Character makes it draw 1', () => {
    const g = koed();
    yes(g);
    payHand(g, [SC14.c2]);
    skipEmptyChoose(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g).sort()).toEqual([SC14.c4, SC14.c6].sort());
  });

  it('declining: it stays in the trash and the hand is untouched', () => {
    const g = koed();
    need(g, 'optional', 'p1');
    no(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
    expect(hand(g)).toEqual([SC14.c2, SC14.c4].sort());
  });

  it('with an empty hand the cost cannot be paid: it stays in the trash', () => {
    const g = koed({ hand: [] });
    offeredUnpayable(g, 'p1');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([ID]);
  });

  it('the trashed hand card is my choice', () => {
    const g = koed({ hand: [SC14.c2, SC14.c4, SC14.c5] });
    yes(g);
    payHand(g, [SC14.c5]);
    expect(trash(g)).toEqual([SC14.c5]);
    expect(BLUE).toBeTruthy();
  });
});
