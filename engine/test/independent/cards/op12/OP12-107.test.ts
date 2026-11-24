/**
 * OP12-107 Donquixote Doflamingo (Character, Yellow, cost 8, 8000, no Counter, {Donquixote Pirates}/{The Seven Warlords of the Sea}).
 *
 * Card text: "If you have 2 or less Life cards, this Character gains [Rush]. (This card can attack on the
 * turn in which it is played.) [Opponent's Turn] [On K.O.] Add up to 1 card from the top of your deck to
 * the top of your Life cards."
 *
 * Rules: CR 10-2-8 ([Rush]), CR 4-8-1 ("up to" allows 0), [Opponent's Turn] limits the [On K.O.] to
 * K.O.s during the opponent's turn, a card added to Life from the deck is face-down.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  canAttack,
  chars,
  deck,
  isMain,
  LDR,
  lifeCards,
  mine,
  need,
  no,
  passBlock,
  pickCards,
  playRaw,
  passCounter,
  SCN,
  theirs,
  topDeck,
  trash,
  yes,
} from './kit-op12c.ts';

const ID = 'OP12-107';

function fresh(life: number) {
  return mine(LDR.neutral, {
    characters: [{ card: ID, playedThisTurn: true } as never],
    life: Array.from({ length: life }, () => SCN.c1),
  });
}

describe('OP12-107 Donquixote Doflamingo: [Rush] with 2 or less Life cards', () => {
  it('boundary: 2 Life cards: [Rush], so a Character played this turn can attack the Leader', () => {
    const g = fresh(2);
    const self = at(g, 'p1', 'characters', ID);
    expect(g.card(self).keywords).toContain('Rush');
    expect(canAttack(g, self, g.leader('p2'))).toBe(true);
  });

  it('boundary: 3 Life cards: no [Rush] and no attack on the turn it is played', () => {
    const g = fresh(3);
    const self = at(g, 'p1', 'characters', ID);
    expect(g.card(self).keywords).not.toContain('Rush');
    expect(canAttack(g, self, g.leader('p2'))).toBe(false);
  });

  it('0 and 1 Life cards also give [Rush]', () => {
    for (const n of [0, 1]) {
      const g = fresh(n);
      expect(g.card(at(g, 'p1', 'characters', ID)).keywords).toContain('Rush');
    }
  });

  it('power is 8000 and cost 8 whatever the Life total', () => {
    const g = fresh(2);
    expect(g.power(at(g, 'p1', 'characters', ID))).toBe(8000);
    expect(g.card(at(g, 'p1', 'characters', ID)).cost).toBe(8);
  });
});

describe("OP12-107 Donquixote Doflamingo: [Opponent's Turn] [On K.O.] add up to 1 card from the deck to the top of Life", () => {
  /** p2's 10000-power Character attacks my rested Doflamingo and K.O.s it. */
  function koed(life = 2) {
    const g = theirs(
      LDR.neutral,
      {
        characters: [{ card: ID, rested: true } as never],
        life: Array.from({ length: life }, () => SCN.c1),
        deck: topDeck([SCN.c3, SCN.c4]),
      },
      { characters: [SCN.c8] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c8), at(g, 'p1', 'characters', ID));
    passBlock(g);
    passCounter(g);
    return g;
  }

  it('K.O.d on the opponent turn: accepting moves the top card of my deck to the top of my Life', () => {
    const g = koed();
    need(g, 'optional', 'p1');
    yes(g);
    expect(lifeCards(g)[0]).toBe(SCN.c3);
    expect(g.life('p1')).toBe(3);
    expect(deck(g)[0]).toBe(SCN.c4);
    expect(trash(g)).toEqual([ID]);
    expect(chars(g)).toEqual([]);
  });

  it('the new Life card is face-down', () => {
    const g = koed();
    yes(g);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
  });

  it('"up to 1": declining adds nothing', () => {
    const g = koed();
    need(g, 'optional', 'p1');
    no(g);
    expect(g.life('p1')).toBe(2);
    expect(deck(g)).toHaveLength(12);
  });

  it('only 1 card is added, not more', () => {
    const g = koed();
    yes(g);
    expect(g.life('p1')).toBe(3);
    expect(deck(g)).toHaveLength(11);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('it has no Life condition: with 5 Life cards the [On K.O.] is still offered', () => {
    const g = koed(5);
    need(g, 'optional', 'p1');
    yes(g);
    expect(g.life('p1')).toBe(6);
  });

  it('with an empty deck nothing can be added (and nothing is asked that depends on the deck)', () => {
    const g = theirs(
      LDR.neutral,
      { characters: [{ card: ID, rested: true } as never], life: [SCN.c1], deck: [SCN.c3] },
      { characters: [SCN.c8] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c8), at(g, 'p1', 'characters', ID));
    passBlock(g);
    passCounter(g);
    expect(trash(g)).toEqual([ID]);
  });

  it('only a K.O. triggers it: a rested Doflamingo that survives the attack (8000 vs 5000) adds nothing', () => {
    const g = theirs(
      LDR.neutral,
      {
        characters: [{ card: ID, rested: true } as never],
        life: [SCN.c1],
        deck: topDeck([SCN.c3]),
      },
      { characters: [SCN.c3] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c3), at(g, 'p1', 'characters', ID));
    passBlock(g);
    passCounter(g);
    expect(chars(g)).toEqual([ID]);
    expect(g.life('p1')).toBe(1);
    expect(atMain(g, 'p2')).toBe(true);
  });

  it('an opposing K.O. effect (OP11-018 Honesty Impact: -4000, then K.O. 6000 or less) also fires it', () => {
    const g = theirs(
      LDR.neutral,
      { characters: [ID], life: [SCN.c1, SCN.c1], deck: topDeck([SCN.c3, SCN.c4]) },
      { hand: ['OP11-018'] },
    );
    playRaw(g, 'OP11-018');
    need(g, 'choose', 'p2');
    pickCards(g, [ID]);
    need(g, 'choose', 'p2');
    pickCards(g, [ID]);
    need(g, 'optional', 'p1');
    yes(g);
    expect(lifeCards(g)[0]).toBe(SCN.c3);
    expect(trash(g)).toEqual([ID]);
  });
});
