/**
 * ST29-014 Roronoa Zoro (Character, Yellow, cost 6, 8000, no Counter, {Straw Hat Crew}/{Egghead}).
 *
 * Card text: "[Rush: Character] (This card can attack Characters on the turn in which it is played.)
 * [Activate: Main] [Once Per Turn] You may trash 1 card with a [Trigger] from your hand: Draw 1 card
 * and give up to 1 rested DON!! card to your Leader or 1 of your Characters."
 *
 * Rules: [Rush: Character] lets it attack Characters (not the Leader) the turn it is played; the cost
 * accepts only a card that HAS a [Trigger]; "up to 1" lets the player give nothing; the draw does not
 * depend on the DON!! being given; [Once Per Turn] limits it to one use per turn.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  C29,
  canHit,
  don,
  fill,
  hand,
  ids29,
  inst,
  isMain,
  kind,
  L29,
  mine,
  need,
  none,
  offeredAbilities,
  offeredIds,
  payCost29,
  pickInst,
  trash,
  useAbility,
} from './kit-st29a.ts';

const ID = 'ST29-014';
const TRIG = C29.speed; // OP01-104 Speed: has a [Trigger]
const TOP = C29.c4; // the card on top of my deck

/** p1's Main Phase: Zoro on board (not new), these hand cards, `rested` rested DON!!. */
function board(handCards: string[], rested = 2, chars: string[] = []) {
  return mine(L29.luffy, {
    characters: [ID, ...chars],
    hand: handCards,
    deck: fill(TOP, 15),
    costArea: { active: 3, rested },
  });
}

describe('ST29-014 Zoro [Rush: Character]', () => {
  it('printed values: cost 6, 8000 power, no Counter value, has [Rush: Character]', () => {
    const g = board([]);
    const z = inst(g, 'p1', 'characters', ID);
    expect(g.card(z).cost).toBe(6);
    expect(g.power(z)).toBe(8000);
    expect(g.card(z).counter ?? null).toBeNull();
    expect(g.card(z).keywords).toContain('Rush: Character');
  });

  it('the turn it is played it may attack a (rested) Character but not the Leader', () => {
    const g = mine(
      L29.luffy,
      { characters: [{ card: ID, playedThisTurn: true }] },
      { characters: [{ card: C29.c3, rested: true }] },
    );
    const z = inst(g, 'p1', 'characters', ID);
    expect(canHit(g, z, inst(g, 'p2', 'characters', C29.c3))).toBe(true);
    expect(canHit(g, z, g.leader('p2'))).toBe(false);
  });

  it('a Character played this turn WITHOUT the keyword cannot attack at all (control)', () => {
    const g = mine(
      L29.luffy,
      { characters: [{ card: C29.c4, playedThisTurn: true }] },
      { characters: [{ card: C29.c3, rested: true }] },
    );
    expect(
      canHit(g, inst(g, 'p1', 'characters', C29.c4), inst(g, 'p2', 'characters', C29.c3)),
    ).toBe(false);
  });
});

describe('ST29-014 Zoro [Activate: Main][Once Per Turn]: trash a [Trigger] card: draw 1, give up to 1 rested DON!!', () => {
  it('only a card with a [Trigger] can pay: with a Trigger card and a plain card in hand, only the Trigger card is offered', () => {
    const g = board([TRIG, C29.c2]);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([TRIG]);
  });

  it('paying draws exactly 1 card and gives 1 rested DON!! to the chosen Leader (+1000 power)', () => {
    const g = board([TRIG, C29.c2]);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payCost29(g, [inst(g, 'p1', 'hand', TRIG)]);
    expect(trash(g)).toEqual([TRIG]);
    expect(hand(g)).toEqual([C29.c2, TOP].sort());
    need(g, 'choose', 'p1');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
    expect(don(g)).toMatchObject({ active: 3, rested: 1, given: 1 });
    expect(isMain(g, 'p1')).toBe(true);
  });

  it('the DON!! may go to a Character instead: the target pick offers my Leader and my Characters only', () => {
    const g = board([TRIG], 1, [C29.c3]);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payCost29(g, [inst(g, 'p1', 'hand', TRIG)]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([L29.luffy, ID, C29.c3].sort());
    pickInst(g, [inst(g, 'p1', 'characters', C29.c3)]);
    expect(g.power(inst(g, 'p1', 'characters', C29.c3))).toBe(6000);
    expect(don(g)).toMatchObject({ rested: 0, given: 1 });
  });

  it('"up to 1": the DON!! may be left where it is; the card is still drawn', () => {
    const g = board([TRIG]);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payCost29(g, [inst(g, 'p1', 'hand', TRIG)]);
    need(g, 'choose', 'p1');
    none(g);
    expect(hand(g)).toEqual([TOP]);
    expect(don(g)).toMatchObject({ rested: 2, given: 0 });
  });

  it('with no rested DON!! the card is still drawn and nothing is given', () => {
    const g = board([TRIG], 0);
    useAbility(g, inst(g, 'p1', 'characters', ID));
    payCost29(g, [inst(g, 'p1', 'hand', TRIG)]);
    if (kind(g) === 'choose') none(g);
    expect(hand(g)).toEqual([TOP]);
    expect(don(g)).toMatchObject({ rested: 0, given: 0 });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('without a [Trigger] card in hand the cost cannot be paid: nothing is drawn, trashed or given', () => {
    const g = board([C29.c2, C29.c3]);
    const z = inst(g, 'p1', 'characters', ID);
    // Either the ability is not offered, or it is and is not payable; neither may change the board.
    expect(offeredAbilities(g, z)).toEqual([]);
    expect(hand(g)).toEqual([C29.c2, C29.c3].sort());
    expect(trash(g)).toEqual([]);
    expect(don(g)).toMatchObject({ rested: 2, given: 0 });
  });

  it('with an empty hand it is not usable either', () => {
    const g = board([]);
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toEqual([]);
  });

  it('[Once Per Turn]: not offered again this turn even with another [Trigger] card in hand; offered next turn', () => {
    const g = board([TRIG, TRIG]);
    const z = inst(g, 'p1', 'characters', ID);
    useAbility(g, z);
    payCost29(g, [inst(g, 'p1', 'hand', TRIG)]);
    none(g);
    expect(offeredAbilities(g, z)).toEqual([]);
    expect(ids29(g, 'p1', 'hand')).toContain(TRIG);
    act(g, { type: 'endTurn' });
    act(g, { type: 'endTurn' });
    expect(isMain(g, 'p1')).toBe(true);
    expect(offeredAbilities(g, inst(g, 'p1', 'characters', ID))).toHaveLength(1);
  });
});
