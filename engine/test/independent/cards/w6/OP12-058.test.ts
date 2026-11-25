/**
 * OP12-058 I Will Make Whitebeard the King of the Pirates (Event, Blue, cost 9, {Whitebeard Pirates}).
 *
 * Card text: "[Main] If your Leader's type includes "Whitebeard Pirates", reveal 1 card from the top of
 * your deck. If that card is a Character card with a type including "Whitebeard Pirates" and a cost
 * of 9 or less, you may play that card. If you do, that Character gains [Rush] during this turn."
 * "[Trigger] Draw 1 card."
 *
 * Rules: "type includes" is a substring match on a type (so {Whitebeard Pirates Allies} and {Former
 * Whitebeard Pirates} count, CR 2-6); a failed "If" stops the effect (the reveal is not done); the
 * revealed card is public so the "you may" is no hidden-card prompt; a card played by an effect pays
 * no cost; a Character played with [Rush] may attack at once (CR 10-1-1); a full Character area
 * makes the player trash one first (CR 3-7-6-1); a [Trigger] is activated from the Life card hit by
 * damage and the card is trashed after it resolves.
 */
import { describe, expect, it } from 'vitest';
import { act, decision } from '../../helpers.ts';
import {
  at,
  atMain,
  attack,
  canHit,
  chars,
  deck,
  don,
  hand,
  hasEvent,
  kind,
  kw,
  L13,
  LW,
  mine,
  need,
  no,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  sorted,
  theirs,
  toMyNextMain,
  trash,
  V13,
  W6,
  yes,
  snap,
  canPlayCard,
} from './kit-w6b.ts';

const EVENT = 'OP12-058';
const FILL = 'OP02-060';

/** p1 plays the Event with a Whitebeard Pirates Leader (ST13-002, 4 Life), 10 active DON!!, and `top` on the deck. */
function play(top: string, o: { leader?: string; chars?: string[]; hand?: string[] } = {}) {
  const g = mine(o.leader ?? L13.ace, {
    hand: [EVENT, ...(o.hand ?? [])],
    deck: [top, FILL, FILL, FILL],
    ...(o.chars ? { characters: o.chars } : {}),
  });
  playRaw(g, EVENT);
  return g;
}

describe('OP12-058 I Will Make Whitebeard the King of the Pirates: reveal the top card; a Whitebeard Pirates Character of cost 9 or less may be played with [Rush]', () => {
  it('printed values: Event, cost 9', () => {
    const g = mine(L13.ace, { hand: [EVENT] });
    const c = g.card(at(g, 'p1', 'hand', EVENT));
    expect(c.cost).toBe(9);
    expect(c.power ?? null).toBeNull();
  });

  it('with a Whitebeard Pirates Leader: the top card is revealed, played from the deck and gains [Rush] (it can attack at once)', () => {
    const g = play(W6.kingdew);
    expect(hasEvent(g, 'CardRevealed', { card: W6.kingdew })).toBe(true);
    yes(g, 'p1');
    expect(atMain(g), snap(g)).toBe(true);
    expect(chars(g)).toEqual([W6.kingdew]);
    expect(deck(g)).toEqual([FILL, FILL, FILL]);
    const k = at(g, 'p1', 'characters', W6.kingdew);
    expect(kw(g, k)).toContain('Rush');
    expect(canHit(g, k, g.leader('p2'))).toBe(true);
    // The play costs no DON!!: only the Event's 9 were rested.
    expect(don(g, 'p1')).toMatchObject({ active: 1, rested: 9 });
  });

  it('"you may": declining leaves the card on top of the deck, nothing is played and nothing has [Rush]', () => {
    const g = play(W6.kingdew, { chars: [V13.hajrudin] });
    no(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([V13.hajrudin]);
    expect(deck(g)).toEqual([W6.kingdew, FILL, FILL, FILL]);
    expect(kw(g, at(g, 'p1', 'characters', V13.hajrudin))).not.toContain('Rush');
    expect(trash(g)).toEqual([EVENT]);
  });

  it('boundary: a cost-9 Character may be played, a cost-10 Character may not (no prompt, it stays on top)', () => {
    const nine = play(W6.oden9);
    yes(nine, 'p1');
    expect(chars(nine)).toEqual([W6.oden9]);
    expect(kw(nine, at(nine, 'p1', 'characters', W6.oden9))).toContain('Rush');

    const ten = play(W6.newgate10);
    expect(hasEvent(ten, 'CardRevealed', { card: W6.newgate10 })).toBe(true);
    expect(atMain(ten), snap(ten)).toBe(true);
    expect(chars(ten)).toEqual([]);
    expect(deck(ten)[0]).toBe(W6.newgate10);
  });

  it('"a type including": {Whitebeard Pirates Allies} and {Former Whitebeard Pirates} Characters qualify', () => {
    for (const top of [W6.doma, W6.marcoFormer, W6.atmos]) {
      const g = play(top);
      yes(g, 'p1');
      expect(chars(g)).toEqual([top]);
      expect(kw(g, at(g, 'p1', 'characters', top))).toContain('Rush');
    }
  });

  it('a non-Character Whitebeard Pirates card, or a Character without the type, is revealed but not played', () => {
    // The Event itself has the type {Whitebeard Pirates} but is not a Character; Mohji is a Character without it.
    for (const top of [EVENT, FILL, W6.zoroSn4]) {
      const g = play(top);
      expect(hasEvent(g, 'CardRevealed', { card: top })).toBe(true);
      expect(atMain(g), snap(g)).toBe(true);
      expect(chars(g)).toEqual([]);
      expect(deck(g)[0]).toBe(top);
    }
  });

  it('with a Leader whose type does not include Whitebeard Pirates nothing is revealed, even if the top card qualifies', () => {
    const g = play(W6.kingdew, { leader: LW.luffy });
    expect(atMain(g), snap(g)).toBe(true);
    expect(hasEvent(g, 'CardRevealed', { card: W6.kingdew })).toBe(false);
    expect(chars(g)).toEqual([]);
    expect(deck(g)[0]).toBe(W6.kingdew);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('with 5 Characters the played Character needs one of mine trashed first', () => {
    const five = [V13.sai, V13.sai, V13.marco, V13.marco, V13.hajrudin];
    const g = play(W6.kingdew, { chars: five });
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    const victim = at(g, 'p1', 'characters', V13.hajrudin);
    expect(offeredIds(g).sort()).toEqual([...five].sort());
    pickInst(g, [victim]);
    expect(atMain(g), snap(g)).toBe(true);
    expect(sorted(g, 'p1', 'characters')).toEqual(
      [V13.sai, V13.sai, V13.marco, V13.marco, W6.kingdew].sort(),
    );
    expect(trash(g)).toContain(V13.hajrudin);
  });

  it('[Rush] lasts this turn only', () => {
    const g = play(W6.kingdew);
    yes(g, 'p1');
    toMyNextMain(g);
    expect(kw(g, at(g, 'p1', 'characters', W6.kingdew))).not.toContain('Rush');
  });

  it('with fewer than 9 DON!! the Event cannot be played', () => {
    const g = mine(L13.ace, {
      hand: [EVENT],
      costArea: { active: 8, rested: 2 },
      deck: [W6.kingdew, FILL],
    });
    expect(canPlayCard(g, at(g, 'p1', 'hand', EVENT))).toBe(false);
  });

  it('[Trigger] Draw 1 card: activated from Life, I draw one card and the Event is trashed', () => {
    const g = theirs(
      L13.ace,
      { life: [EVENT, FILL, FILL, FILL], deck: [FILL, FILL, FILL] },
      { characters: [V13.hajrudin] },
    );
    attack(g, at(g, 'p2', 'characters', V13.hajrudin), g.leader('p1'));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    need(g, 'trigger', 'p1');
    act(g, { type: 'trigger', activate: true });
    expect(decision(g)?.kind === 'main' && decision(g)?.player === 'p2', snap(g)).toBe(true);
    expect(hand(g)).toEqual([FILL]);
    expect(trash(g)).toEqual([EVENT]);
    expect(g.life('p1')).toBe(3);
  });
});
