/**
 * EB04-060 Gum-Gum Hawk Gatling (Event, Yellow, cost 2, {Straw Hat Crew}/{The Four Emperors}/{Egghead}).
 *
 * Card text: "[Main] You may add 1 card from the top or bottom of your Life cards to your hand: Add up
 * to 1 {Egghead} type Character card from your hand to the top of your Life cards face-up. Then,
 * give up to 1 of your opponent's Characters −1000 power during this turn."
 * "[Trigger] Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: the cost takes the top or the bottom Life card (the player chooses) into the hand. A card
 * added to Life by an effect "face-up" is placed on top, face-up (CR 3-10-2-1). "Up to 1" may be
 * none; the pick over the hidden hand is asked even if nothing matches.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  BLUE,
  fill,
  hand,
  kind,
  LB,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  pickRaw,
  playRaw,
  theirs,
  trash,
  unusable,
  yes,
  atMain,
  endTurn,
  type TestGame,
} from './kit-eb04b.ts';

const ID = 'EB04-060';
/** ST21-013 Vegapunk: Red, cost 1, 3000, {Scientist}/{Egghead}, a Character. */
const EGG_A = 'ST21-013';
/** ST29-006 Stussy: Yellow, cost 6, 7000, {Egghead}, a Character. */
const EGG_B = 'ST29-006';
/** EB04-008 Distorted Future: Red Event with the {Egghead} type (not a Character). */
const EGG_EVENT = 'EB04-008';
const SAI = 'OP01-012'; // Red, cost 2, 4000, not Egghead
const HAJ = 'OP01-018';
const KINGDEW = 'OP02-006'; // Red, 7000
const MARCO = 'OP01-023';

const LIFE = [SAI, BLUE, BLUE, HAJ]; // top first: Sai ... Hajrudin at the bottom

function cast(life: string[], hnd: string[], foes: string[] = [KINGDEW]): TestGame {
  const g = mine(
    LB.egghead,
    { hand: [ID, ...hnd], life, deck: fill(BLUE, 10) },
    { characters: foes },
  );
  playRaw(g, ID);
  return g;
}

function option(g: TestGame, id: 'top' | 'bottom'): void {
  need(g, 'choose', 'p1');
  act(g, { type: 'pick', choice: { option: id } });
}

describe('EB04-060 Gum-Gum Hawk Gatling [Main]: Life card to hand, an {Egghead} Character to the top of Life, then -1000 power', () => {
  it('taking the top Life card: it goes to the hand, the Egghead Character goes on top face-up, the target gets -1000', () => {
    const g = cast(LIFE, [EGG_A, EGG_B]);
    yes(g);
    option(g, 'top');
    need(g, 'choose', 'p1');
    pickRaw(g, g.find('p1', 'hand', EGG_B));
    need(g, 'choose', 'p1');
    pickRaw(g, at(g, 'p2', 'characters', KINGDEW));
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(4);
    const top = g.zone('p1', 'life')[0]!;
    expect(top.card).toBe(EGG_B);
    expect(top.faceUp).toBe(true);
    expect(hand(g)).toEqual([EGG_A, SAI].sort());
    expect(g.power(at(g, 'p2', 'characters', KINGDEW))).toBe(6000);
  });

  it('taking the bottom Life card: the bottom card goes to the hand and the old top card stays under the new one', () => {
    const g = cast(LIFE, [EGG_A]);
    yes(g);
    option(g, 'bottom');
    pickRaw(g, g.find('p1', 'hand', EGG_A));
    pickRaw(g, at(g, 'p2', 'characters', KINGDEW));
    const life = g.zone('p1', 'life').map((c) => c.card);
    expect(life).toEqual([EGG_A, SAI, BLUE, BLUE]);
    expect(hand(g)).toEqual([HAJ]);
  });

  it('offers {Egghead} Character cards only: not an Egghead Event, not other Characters', () => {
    const g = cast(LIFE, [EGG_A, EGG_EVENT, MARCO]);
    yes(g);
    option(g, 'top');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EGG_A]);
  });

  it('the Life card taken as the cost can itself be the {Egghead} Character placed back', () => {
    const g = cast([EGG_A, BLUE, BLUE, BLUE], []);
    yes(g);
    option(g, 'top');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([EGG_A]);
    pickRaw(g, g.find('p1', 'hand', EGG_A));
    pickRaw(g, at(g, 'p2', 'characters', KINGDEW));
    expect(g.zone('p1', 'life')[0]!.card).toBe(EGG_A);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(hand(g)).toEqual([]);
  });

  it('"up to 1": may place no card; the Life card stays in the hand and Life has one card fewer', () => {
    const g = cast(LIFE, [EGG_A]);
    yes(g);
    option(g, 'top');
    need(g, 'choose', 'p1');
    none(g);
    if (kind(g) === 'choose') none(g);
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([EGG_A, SAI].sort());
  });

  it('with no {Egghead} Character in hand the pick is still asked (the hand is hidden), with no candidates', () => {
    const g = cast(LIFE, [MARCO]);
    yes(g);
    option(g, 'top');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([]);
    none(g);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the cost: no Life card moves and nobody loses power', () => {
    const g = cast(LIFE, [EGG_A]);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([EGG_A]);
    expect(g.power(at(g, 'p2', 'characters', KINGDEW))).toBe(7000);
    expect(trash(g)).toEqual([ID]);
  });

  it('with 0 Life cards the cost cannot be paid and nothing happens', () => {
    const g = cast([], [EGG_A]);
    unusable(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([EGG_A]);
    expect(g.life('p1')).toBe(0);
    expect(g.power(at(g, 'p2', 'characters', KINGDEW))).toBe(7000);
  });

  it('the -1000 power lasts only for this turn', () => {
    const g = cast(LIFE, [EGG_A]);
    yes(g);
    option(g, 'top');
    pickRaw(g, g.find('p1', 'hand', EGG_A));
    pickRaw(g, at(g, 'p2', 'characters', KINGDEW));
    expect(g.power(at(g, 'p2', 'characters', KINGDEW))).toBe(6000);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.power(at(g, 'p2', 'characters', KINGDEW))).toBe(7000);
  });
});

describe('EB04-060 Gum-Gum Hawk Gatling [Trigger]: draw 2 cards and trash 1 card from your hand', () => {
  it('draws 2 and trashes 1 chosen card when revealed from Life', () => {
    const g = theirs(
      LB.egghead,
      { life: [ID, BLUE, BLUE, BLUE], hand: [SAI], deck: [HAJ, MARCO, ...fill(BLUE, 8)] },
      { characters: [KINGDEW] },
    );
    attack(g, at(g, 'p2', 'characters', KINGDEW), g.leader('p1'));
    passBlock(g);
    g.act({ type: 'endCounter' });
    expect(kind(g)).toBe('trigger');
    g.act({ type: 'trigger', activate: true });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([HAJ, MARCO, SAI].sort());
    pickRaw(g, g.find('p1', 'hand', SAI));
    expect(hand(g)).toEqual([HAJ, MARCO].sort());
    expect(trash(g)).toContain(SAI);
  });
});
