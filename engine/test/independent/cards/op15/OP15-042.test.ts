/**
 * OP15-042 Kyros (Character, Blue, cost 3, 5000, no Counter, {Dressrosa}).
 *
 * Card text: "[On Play] You may trash 1 card from your hand: If your Leader is [Rebecca], this
 * Character gains [Rush] during this turn. [On K.O.] Add this Character card from your trash to
 * your hand."
 *
 * Rules: CR 8-3-1 (cost, hidden-hand "you may" is offered even when unpayable, accept illegal),
 * CR 10-1-1 ([Rush]), CR 10-2-17 ([On K.O.]: the card is already in the trash when it resolves).
 * Both Rebecca Leaders (OP04-039, OP15-039) are named [Rebecca].
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from './kit-op15a.ts';
import {
  at,
  canHit,
  chars,
  hand,
  kind,
  kw,
  LD15,
  mine,
  need,
  no,
  offeredIds,
  payHand,
  playRaw,
  SCN,
  theirs,
  trash,
  unusable,
  yes,
} from './kit-op15a.ts';

const KYROS = 'OP15-042';

function board(leader: string, handCards: string[] = [SCN.c2]) {
  return mine(leader, { hand: [KYROS, ...handCards] }, { characters: [SCN.c3] });
}
const kyros = (g: ReturnType<typeof board>) => at(g, 'p1', 'characters', KYROS);

describe('OP15-042 Kyros: [On Play] trash 1 card: [Rush] with a [Rebecca] Leader', () => {
  it('with an OP15-039 [Rebecca] Leader, paying the cost gives [Rush]: it can attack the turn it is played', () => {
    const g = board(LD15.rebecca);
    playRaw(g, KYROS);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    payHand(g, [SCN.c2]);
    need(g, 'main', 'p1');
    expect(kw(g, kyros(g))).toContain('Rush');
    expect(canHit(g, kyros(g), g.leader('p2'))).toBe(true);
    expect(trash(g)).toEqual([SCN.c2]);
  });

  it('the OP04-039 Rebecca Leader (same name) works as well', () => {
    const g = board(LD15.rebeccaOld);
    playRaw(g, KYROS);
    yes(g, 'p1');
    payHand(g, [SCN.c2]);
    expect(kw(g, kyros(g))).toContain('Rush');
  });

  it('without paying (declining) there is no [Rush], nothing is trashed, and it cannot attack', () => {
    const g = board(LD15.rebecca);
    playRaw(g, KYROS);
    no(g, 'p1');
    need(g, 'main', 'p1');
    expect(kw(g, kyros(g))).not.toContain('Rush');
    expect(hand(g)).toEqual([SCN.c2]);
    expect(canHit(g, kyros(g), g.leader('p2'))).toBe(false);
  });

  it('the cost is exactly 1 card chosen by me from my hand', () => {
    const g = board(LD15.rebecca, [SCN.c2, SCN.c4]);
    playRaw(g, KYROS);
    yes(g, 'p1');
    expect(offeredIds(g)).toEqual([SCN.c2, SCN.c4].sort());
    payHand(g, [SCN.c4]);
    expect(trash(g)).toEqual([SCN.c4]);
    expect(hand(g)).toEqual([SCN.c2]);
  });

  it('with an empty hand the cost cannot be paid: no [Rush]', () => {
    const g = board(LD15.rebecca, []);
    playRaw(g, KYROS);
    unusable(g, 'p1');
    need(g, 'main', 'p1');
    expect(kw(g, kyros(g))).not.toContain('Rush');
  });

  it('with a Leader that is not [Rebecca] there is no [Rush] even after trashing a card', () => {
    const g = board(LD15.dressrosa);
    playRaw(g, KYROS);
    if (kind(g) === 'optional') {
      yes(g, 'p1');
      if (kind(g) === 'choose') payHand(g, [SCN.c2]);
    }
    need(g, 'main', 'p1');
    expect(kw(g, kyros(g))).not.toContain('Rush');
    expect(canHit(g, kyros(g), g.leader('p2'))).toBe(false);
  });

  it('[Rush] lasts only this turn: gone in my next turn', () => {
    const g = board(LD15.rebecca);
    playRaw(g, KYROS);
    yes(g, 'p1');
    payHand(g, [SCN.c2]);
    expect(kw(g, kyros(g))).toContain('Rush');
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(kw(g, kyros(g))).not.toContain('Rush');
  });
});

describe('OP15-042 Kyros: [On K.O.] add this card from the trash to hand', () => {
  function koKyros() {
    const g = theirs(
      LD15.rebecca,
      { characters: [{ card: KYROS, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c3), at(g, 'p1', 'characters', KYROS));
    passBlock(g);
    passCounter(g);
    return g;
  }

  it('when K.O.d in battle it returns from the trash to my hand', () => {
    const g = koKyros();
    need(g, 'main', 'p2');
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toEqual([]);
    expect(hand(g)).toEqual([KYROS]);
  });

  it('it returns whatever my Leader is (no Leader condition on [On K.O.])', () => {
    const g = theirs(
      LD15.luffy,
      { characters: [{ card: KYROS, rested: true }] },
      { characters: [SCN.c3] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c3), at(g, 'p1', 'characters', KYROS));
    passBlock(g);
    passCounter(g);
    expect(hand(g)).toEqual([KYROS]);
  });

  it('it stays when it survives the battle', () => {
    const g = theirs(
      LD15.rebecca,
      { characters: [{ card: KYROS, rested: true }] },
      { characters: [SCN.c1] },
    );
    attack(g, at(g, 'p2', 'characters', SCN.c1), at(g, 'p1', 'characters', KYROS));
    passBlock(g);
    passCounter(g);
    expect(chars(g)).toEqual([KYROS]);
    expect(hand(g)).toEqual([]);
  });
});
