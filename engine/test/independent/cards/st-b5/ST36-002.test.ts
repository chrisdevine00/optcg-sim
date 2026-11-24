/**
 * ST36-002 Killer (Yellow Character, cost 4, 6000, no Counter, Slash, {Kid Pirates}/{Supernovas}).
 *
 * Card text: "[Your Turn] [On Play] If your Leader has the {Kid Pirates} type, add up to 1 card from the top of
 * your deck to the top of your Life cards.
 * [Trigger] If your opponent has 3 or less Life cards, play this card."
 *
 * Rules: CR 8-3-3 (failed "if"), CR 8-4-4-1 ("up to"), [Your Turn] only works on the controller's own
 * turn (so not when played from a [Trigger] on the opponent's turn), [Trigger] activation (CR 10-1-5,
 * RL-25), RL-26.
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  attack,
  BLUE,
  cardIds,
  deck,
  fill,
  hand,
  kind,
  LDB,
  lifeCards,
  mine,
  need,
  no,
  noDefenceUntilTrigger,
  playRaw,
  SB,
  T,
  theirs,
  trash,
  yes,
  activateTrigger,
  declineTrigger,
} from './kit-stb5b.ts';

const KILLER = T.killer;
const TOP = SB.c3p5;

function ownTurn(leader: string) {
  return mine(leader, { hand: [KILLER], deck: [TOP, ...fill(BLUE, 14)], life: fill(BLUE, 4) });
}

/** p2 hits p1's Leader; Killer is the top Life card of p1; stops at p1's [Trigger] decision. */
function hit(p2Life: number, leader: string = LDB.kid) {
  const g = theirs(
    leader,
    { life: [KILLER, ...fill(BLUE, 3)], deck: [TOP, ...fill(BLUE, 14)] },
    { life: fill(BLUE, p2Life) },
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  noDefenceUntilTrigger(g);
  return g;
}

describe('ST36-002 Killer: [Your Turn] [On Play] Kid Pirates Leader: add the top card to Life; [Trigger] opponent 3 or less Life: play it', () => {
  it('Kid Pirates Leader, own turn: the top card of the deck is added to the top of Life', () => {
    const g = ownTurn(LDB.kid);
    playRaw(g, KILLER);
    yes(g);
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(5);
    expect(lifeCards(g)[0]).toBe(TOP);
    expect(deck(g)).toHaveLength(14);
  });

  it('"up to 1": the player may add nothing', () => {
    const g = ownTurn(LDB.kid);
    playRaw(g, KILLER);
    no(g);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(15);
  });

  it('CR 8-3-3: a Leader without the {Kid Pirates} type (Supernovas only): nothing is added', () => {
    const g = ownTurn(LDB.strike);
    playRaw(g, KILLER);
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(15);
  });

  it('Killer is on the field after being played and cost 4 is paid', () => {
    const g = ownTurn(LDB.strike);
    playRaw(g, KILLER);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KILLER]);
  });

  it('[Trigger] with the opponent at 3 Life: Killer is played from the Life', () => {
    const g = hit(3);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KILLER]);
    expect(hand(g)).toEqual([]);
  });

  it('[Trigger] boundary: with the opponent at 4 Life the play does not happen', () => {
    const g = hit(4);
    expect(kind(g)).toBe('trigger');
    activateTrigger(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Trigger] at 0 or 1 Life of the opponent still plays (3 or LESS)', () => {
    const g = hit(1);
    activateTrigger(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KILLER]);
  });

  it('[Your Turn]: played from the [Trigger] on the opponent turn, the [On Play] does not add Life, even with a Kid Pirates Leader', () => {
    const g = hit(3, LDB.kid);
    activateTrigger(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([KILLER]);
    // Killer left the Life as the damage card: 4 Life before, 3 after, and nothing was added.
    expect(g.life('p1')).toBe(3);
    expect(deck(g)).toHaveLength(15);
    expect(kind(g)).toBe('main');
  });

  it('not activating the [Trigger]: Killer goes to the hand', () => {
    const g = hit(3);
    declineTrigger(g);
    expect(hand(g)).toEqual([KILLER]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('activating the [Trigger] with a failing condition leaves Killer off the field and not in the hand', () => {
    const g = hit(4);
    activateTrigger(g);
    expect(hand(g)).toEqual([]);
    expect(trash(g, 'p1')).toEqual([KILLER]);
    expect(need(g, 'main', 'p2')).toBeDefined();
  });
});
