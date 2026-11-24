/**
 * OP16-021 Moby Dick (Stage, Red, cost 1, {Whitebeard Pirates}).
 *
 * Card text: "[On Play] If your Leader has the {Whitebeard Pirates} type, look at 3 cards from the top
 * of your deck and add up to 1 card to your hand. Then, place the rest at the bottom of your deck in
 * any order.
 * [Activate: Main] You may trash this Stage: Give up to 1 rested DON!! card to your Leader or 1 of
 * your Characters."
 *
 * Rules: CR 8-4-4 ("look at"/"up to"), CR 3-9 (Stage area), CR 6-5-5 (given DON!! stay rested, CR
 * 6-5-5-4), CR 8-3-1 (a cost trashes the Stage), RL-12.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  choices,
  choose,
  deck,
  don,
  fill,
  hand,
  kind,
  mayChooseNone,
  mine,
  need,
  none,
  OL,
  OV,
  offeredIds,
  offeredAbilities,
  pickInst,
  playCard,
  settleOrders,
  tail,
  trash,
  useAbility,
  BLUE,
} from './kit-op16a.ts';

const MOBY = 'OP16-021';
const TOP3 = [OV.thatch, OV.sai4, OV.marco5];
const REST = [OV.komachiyo3, ...fill(BLUE, 6)];

function start(leader: string = OL.ace, top: string[] = TOP3) {
  const g = mine(leader, { hand: [MOBY], deck: [...top, ...REST] });
  playCard(g, MOBY);
  return g;
}

describe('OP16-021 Moby Dick: [On Play] look at 3, add up to 1', () => {
  it('with a {Whitebeard Pirates} Leader: offers exactly the top 3 cards and adds the chosen one to hand', () => {
    const g = start();
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([...TOP3].sort());
    choose(g, [g.zone('p1', 'deck').find((c) => c.card === OV.sai4)!.instance]);
    settleOrders(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([OV.sai4]);
  });

  it('any card may be added (a Character, not only a type): all three differently-typed cards are offered', () => {
    const g = start(OL.ace, [OV.thatch, OV.accino10, OV.cobra0]);
    expect(offeredIds(g)).toEqual([OV.accino10, OV.cobra0, OV.thatch].sort());
  });

  it('the other two go to the bottom of the deck (in any order); the 4th card is now on top', () => {
    const g = start();
    choose(g, [g.zone('p1', 'deck').find((c) => c.card === OV.sai4)!.instance]);
    settleOrders(g);
    expect(deck(g)).toHaveLength(TOP3.length + REST.length - 1);
    expect(deck(g)[0]).toBe(OV.komachiyo3);
    expect(tail(deck(g), 2)).toEqual([OV.thatch, OV.marco5].sort());
  });

  it('"up to 1": may add nothing; all three go to the bottom', () => {
    const g = start();
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    settleOrders(g);
    expect(hand(g)).toEqual([]);
    expect(deck(g)).toHaveLength(TOP3.length + REST.length);
    expect(deck(g)[0]).toBe(OV.komachiyo3);
    expect(tail(deck(g), 3)).toEqual([...TOP3].sort());
  });

  it('adds at most 1 card (a second pick is not possible once one is chosen)', () => {
    const g = start();
    const [a, b] = [
      g.zone('p1', 'deck').find((c) => c.card === OV.thatch)!.instance,
      g.zone('p1', 'deck').find((c) => c.card === OV.sai4)!.instance,
    ];
    g.act({ type: 'pick', choice: a });
    expect(choices(g)).not.toContain(b);
  });

  it('only 3 cards are looked at: the 4th is never offered', () => {
    const g = start();
    expect(offeredIds(g)).not.toContain(OV.komachiyo3);
  });

  it('a Leader without the {Whitebeard Pirates} type: nothing is looked at, the Stage is simply played', () => {
    const g = start(OL.luffy);
    expect(kind(g)).toBe('main');
    expect(deck(g)).toHaveLength(TOP3.length + REST.length);
    expect(deck(g).slice(0, 3)).toEqual(TOP3);
    expect(hand(g)).toEqual([]);
    expect(at(g, 'p1', 'stage', MOBY)).toBeDefined();
  });

  it('is played into the Stage area for its cost of 1', () => {
    const g = start();
    expect(g.zone('p1', 'stage').map((c) => c.card)).toEqual([MOBY]);
    expect(don(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
  });
});

describe('OP16-021 Moby Dick: [Activate: Main] trash this Stage: give a rested DON!!', () => {
  const field = (active: number, rested: number, chars: string[] = [OV.sai4]) =>
    mine(OL.ace, { stage: MOBY, characters: chars, costArea: { active, rested } });

  it('is offered in the Main Phase', () => {
    const g = field(5, 5);
    expect(offeredAbilities(g, at(g, 'p1', 'stage', MOBY))).toHaveLength(1);
  });

  it('trashes the Stage and gives 1 rested DON!! to my Leader (the DON!! stays rested)', () => {
    const g = field(5, 5);
    useAbility(g, at(g, 'p1', 'stage', MOBY));
    need(g, 'choose');
    pickInst(g, [g.leader('p1')]);
    expect(trash(g)).toEqual([MOBY]);
    expect(g.zone('p1', 'stage')).toHaveLength(0);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 4, given: 1 });
    expect(g.card(g.leader('p1')).don).toBe(1);
  });

  it('may instead give it to one of my Characters', () => {
    const g = field(5, 5);
    useAbility(g, at(g, 'p1', 'stage', MOBY));
    pickInst(g, [at(g, 'p1', 'characters', OV.sai4)]);
    expect(g.card(at(g, 'p1', 'characters', OV.sai4)).don).toBe(1);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('only a RESTED DON!! is given: active DON!! stay active', () => {
    const g = field(5, 1);
    useAbility(g, at(g, 'p1', 'stage', MOBY));
    pickInst(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ active: 5, rested: 0, given: 1 });
  });

  it('the targets offered are my Leader and my Characters only', () => {
    const g = mine(
      OL.ace,
      { stage: MOBY, characters: [OV.sai4], costArea: { active: 5, rested: 5 } },
      { characters: [OV.hajrudin6] },
    );
    useAbility(g, at(g, 'p1', 'stage', MOBY));
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.sai4, OL.ace].sort());
  });

  it('"up to 1": may give nothing; the Stage is still trashed', () => {
    const g = field(5, 5);
    useAbility(g, at(g, 'p1', 'stage', MOBY));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(trash(g)).toEqual([MOBY]);
    expect(don(g, 'p1')).toMatchObject({ rested: 5, given: 0 });
  });

  it('gives only 1 DON!!, not more', () => {
    const g = field(0, 10);
    useAbility(g, at(g, 'p1', 'stage', MOBY));
    pickInst(g, [g.leader('p1')]);
    expect(don(g, 'p1')).toMatchObject({ rested: 9, given: 1 });
  });

  it('can be used the turn the Stage is played (Stages have no summoning sickness)', () => {
    const g = mine(OL.ace, { hand: [MOBY], deck: [...TOP3, ...REST] });
    playCard(g, MOBY);
    choose(g, [g.zone('p1', 'deck')[0]!.instance]);
    settleOrders(g);
    expect(offeredAbilities(g, at(g, 'p1', 'stage', MOBY))).toHaveLength(1);
  });
});

