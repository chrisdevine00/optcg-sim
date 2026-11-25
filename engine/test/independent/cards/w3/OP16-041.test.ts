/**
 * OP16-041 Buggy (Leader, Blue, 5000, 5 Life, {Buggy Pirates}/{Impel Down}, <Slash>).
 *
 * Card text: "[DON!! x1] [Once Per Turn] This effect can be activated when your {Impel Down} type
 * Character card is removed from the field. Play up to 1 [Prisoner of Impel Down] card from your
 * hand."
 *
 * Open: M6b-Q42 (order against a K.O.'d Character's own [On K.O.]) and M6b-Q43 (a Character
 * trashed to make room): no test depends on either. Rules: [DON!! x1] needs 1 DON!! given to the
 * Leader (CR 8-3-2-3); "removed from the field" is any move off the field (K.O., return to the
 * hand, trash), by either player's effect or in battle; "your" Character only; [Once Per Turn]
 * CR 10-2-13; "up to" allows 0 (CR 8-4-4-1); playing by an effect pays no cost.
 */
import { describe, expect, it } from 'vitest';
import { decision } from '../../helpers.ts';
import {
  act,
  atMain,
  attack,
  cardIds,
  choices,
  don,
  endUpTo,
  hand,
  kind,
  need,
  offeredIds,
  passBlock,
  pickInst,
  mine,
  theirsLeader,
  W3C,
  no,
  yes,
} from './kit-w3.ts';

const BUGGY = 'OP16-041';
const PRISONER = W3C.prisoner;
const BLUGORI = W3C.blugori;

type Spec = NonNullable<Parameters<typeof mine>[1]>;
/** My Main Phase; Buggy has 1 DON!! given (DON!! x1), 9 active DON!! left. */
function myTurn(spec: Spec = {}, withDon = true) {
  return mine(
    { card: BUGGY, don: withDon ? 1 : 0 },
    {
      characters: [BLUGORI],
      hand: [PRISONER],
      costArea: { active: withDon ? 9 : 10, rested: 0 },
      ...spec,
    },
    { characters: [W3C.sai], costArea: { active: 0, rested: 0 } },
  );
}
/**
 * "This effect can be activated when ..." is optional (W57-R5, the official Koala Q&A): the use is
 * asked, and these tests use it. Only Buggy's question is answered.
 */
function use(g: ReturnType<typeof myTurn>) {
  const d = decision(g);
  if (d?.kind === 'optional' && d.source?.card === BUGGY) yes(g, 'p1');
}
/** I play the Rocks Pirates Event (rest 5 DON!!: return up to 1 Character with cost 6 or less) on `card`. */
function bounce(g: ReturnType<typeof myTurn>, who: 'p1' | 'p2', card: string) {
  const target = g.find(who, 'characters', card);
  act(g, { type: 'playCard', card: g.find('p1', 'hand', W3C.bounce) });
  yes(g, 'p1');
  pickInst(g, [target]);
  use(g);
}

describe('OP16-041 Buggy: [DON!! x1] [Once Per Turn] when my {Impel Down} Character is removed, play [Prisoner of Impel Down]', () => {
  it('my {Impel Down} Character is returned to my hand: I may play the Prisoner from hand', () => {
    const g = myTurn({ hand: [PRISONER, W3C.bounce] });
    bounce(g, 'p1', BLUGORI);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', PRISONER)]);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([PRISONER]);
    expect(hand(g)).toEqual([BLUGORI]);
  });

  it('only [Prisoner of Impel Down] is offered, not other cards of the hand', () => {
    const g = myTurn({ hand: [PRISONER, W3C.bounce, W3C.sphinx, W3C.marco] });
    bounce(g, 'p1', BLUGORI);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PRISONER]);
  });

  it('the play is free: no DON!! is spent on its cost 6', () => {
    const g = myTurn({ hand: [PRISONER, W3C.bounce] });
    bounce(g, 'p1', BLUGORI);
    pickInst(g, [g.find('p1', 'hand', PRISONER)]);
    // Only the Event's own cost (rest 5 of 9 active DON!!) was paid.
    expect(don(g, 'p1')).toMatchObject({ active: 4, rested: 5, given: 1 });
  });

  it('"up to 1": may play nothing, and the Prisoner stays in hand', () => {
    const g = myTurn({ hand: [PRISONER, W3C.bounce] });
    bounce(g, 'p1', BLUGORI);
    endUpTo(g);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([BLUGORI, PRISONER].sort());
  });

  it('[DON!! x1]: with no DON!! given to the Leader nothing happens', () => {
    const g = myTurn({ hand: [PRISONER, W3C.bounce] }, false);
    bounce(g, 'p1', BLUGORI);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([BLUGORI, PRISONER].sort());
  });

  it('a removed Character that is not {Impel Down} does not trigger it', () => {
    const g = myTurn({ characters: [W3C.thatch], hand: [PRISONER, W3C.bounce] });
    bounce(g, 'p1', W3C.thatch);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('the opponent\'s {Impel Down} Character being removed is not "your" Character', () => {
    const g = mine(
      { card: BUGGY, don: 1 },
      { hand: [PRISONER, W3C.bounce], costArea: { active: 9, rested: 0 } },
      { characters: [W3C.sphinx] },
    );
    bounce(g, 'p2', W3C.sphinx);
    expect(kind(g)).toBe('main');
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it("it also works on the opponent's turn: my Character is K.O.'d by their effect", () => {
    const g = theirsLeader(
      { card: BUGGY, don: 1 },
      { characters: [BLUGORI], hand: [PRISONER] },
      { hand: [W3C.impactDial], characters: [W3C.thatch] },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.impactDial) });
    pickInst(g, [g.find('p1', 'characters', BLUGORI)]);
    use(g as never);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', PRISONER)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([PRISONER]);
  });

  it("it also works when my Character is K.O.'d in battle", () => {
    const g = theirsLeader(
      { card: BUGGY, don: 1 },
      { characters: [{ card: BLUGORI, rested: true }], hand: [PRISONER] },
      { characters: [W3C.thatch] },
    );
    attack(g, g.find('p2', 'characters', W3C.thatch), g.find('p1', 'characters', BLUGORI));
    passBlock(g);
    act(g, { type: 'endCounter' });
    use(g as never);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([PRISONER]);
    pickInst(g, [g.find('p1', 'hand', PRISONER)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([PRISONER]);
  });

  it('[Once Per Turn]: a second {Impel Down} Character removed the same turn does not trigger it again', () => {
    const g = theirsLeader(
      { card: BUGGY, don: 1 },
      { characters: [BLUGORI, W3C.sphinx], hand: [PRISONER, PRISONER] },
      { hand: [W3C.impactDial, W3C.impactDial], characters: [W3C.thatch] },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.impactDial) });
    pickInst(g, [g.find('p1', 'characters', BLUGORI)]);
    use(g as never);
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', PRISONER)]);
    expect(atMain(g, 'p2')).toBe(true);
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.impactDial) });
    pickInst(g, [g.find('p1', 'characters', W3C.sphinx)]);
    use(g as never);
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([PRISONER]);
    expect(hand(g)).toEqual([PRISONER]);
    void choices;
  });

  it('W57-R5: "can be activated" is optional: declining plays nothing and does not spend the Once Per Turn', () => {
    const g = theirsLeader(
      { card: BUGGY, don: 1 },
      { characters: [BLUGORI, W3C.sphinx], hand: [PRISONER] },
      { hand: [W3C.impactDial, W3C.impactDial], characters: [W3C.thatch] },
    );
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.impactDial) });
    pickInst(g, [g.find('p1', 'characters', BLUGORI)]);
    no(g, 'p1');
    expect(atMain(g, 'p2')).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([W3C.sphinx]);
    act(g, { type: 'playCard', card: g.find('p2', 'hand', W3C.impactDial) });
    pickInst(g, [g.find('p1', 'characters', W3C.sphinx)]);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [g.find('p1', 'hand', PRISONER)]);
    expect(cardIds(g, 'p1', 'characters')).toEqual([PRISONER]);
  });

  it('with no Prisoner in hand nothing can be played', () => {
    const g = myTurn({ hand: [W3C.bounce, W3C.marco] });
    bounce(g, 'p1', BLUGORI);
    if (kind(g) === 'choose') {
      expect(choices(g)).toEqual([]);
      endUpTo(g);
    }
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });
});
