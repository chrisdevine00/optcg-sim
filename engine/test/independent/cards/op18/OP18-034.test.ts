/**
 * OP18-034 Franky (Character, Green, cost 6, 7000, no Counter, {Water Seven}/{The Franky Family}/
 * {Straw Hat Crew}).
 *
 * Card text (cards/data):
 *   "[On Play] Play up to 1 {The Franky Family} or {Straw Hat Crew} type card with a cost of 5 or
 *    less from your hand. Then, if you have a Stage with a cost of 5 or more, rest up to 1 of your
 *    opponent's Characters with a cost of 6 or less."
 *
 * Rules: "play up to 1 ... from your hand" pays no cost (CR 8-2-2-style: an effect play is free) and
 * is an "up to" pick. "Type card" includes Stage cards. The "Then, if ..." is an effect condition
 * checked after the play (a colon-less "if" gates the rest only, DECISIONS 2026-11-24). "Cost of
 * 5 or more" / "6 or less" are inclusive. The rest target may be skipped ("up to 1").
 *
 * Scenery: Characters OP02-039 Franky (cost 5, {FILM}/{Straw Hat Crew}), OP10-014 Franky (cost 6,
 * {Straw Hat Crew}), OP03-061 Kiwi & Mozu (cost 2, {Water Seven}/{The Franky Family}), OP01-023 Marco
 * (cost 3, no relevant type); Stages OP05-040 Birdcage (cost 5), OP06-041 The Ark Noah (cost 6),
 * OP03-075 Galley-La Company (cost 3, {Water Seven}), EB02-060 Merry Go (cost 2, {Straw Hat Crew}).
 */
import { describe, expect, it } from 'vitest';
import {
  atMain,
  CH,
  cardIds,
  choices,
  donOf,
  kind,
  LDR,
  mine,
  offeredIds,
  pickCards,
  pickInst,
  playCard,
  skipPick,
  settleEmpty,
  STG,
  type Chars,
} from './kit-ga.ts';
import type { PlayerSpec } from '@optcg/engine';

const FRANKY = 'OP18-034';

/** p1's Main Phase with Franky in hand and 10 DON!!; plays it. The first prompt (the play pick) is pending. */
function play(hand: string[], p1: Partial<PlayerSpec> = {}, p2: Chars = []) {
  const g = mine(LDR.luffy, { hand: [FRANKY, ...hand], ...p1 }, { characters: p2 });
  playCard(g, FRANKY);
  return g;
}

/** Same, but with no candidate in hand: the empty "up to 1" play pick (if asked) is passed. */
function thenPart(p1: Partial<PlayerSpec>, p2: Chars) {
  const g = play([], p1, p2);
  settleEmpty(g);
  return g;
}

describe('OP18-034 Franky: [On Play] play up to 1 {The Franky Family} or {Straw Hat Crew} card (cost 5 or less) from hand', () => {
  it('happy path: a {Straw Hat Crew} cost 5 Character is offered, played active and for free', () => {
    const g = play([CH.franky5]);
    expect(offeredIds(g)).toEqual([CH.franky5]);
    pickCards(g, [CH.franky5]);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([CH.franky5, FRANKY].sort());
    expect(g.card(g.find('p1', 'characters', CH.franky5)).rested).toBe(false);
    expect(cardIds(g, 'p1', 'hand')).toEqual([]);
  });

  it('the played card costs no DON!!: only Franky’s own 6 DON!! were rested', () => {
    const g = play([CH.franky5]);
    pickCards(g, [CH.franky5]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 4, rested: 6 });
    expect(atMain(g)).toBe(true);
  });

  it('{The Franky Family} type counts: Kiwi & Mozu is offered', () => {
    const g = play([CH.kiwi2]);
    expect(offeredIds(g)).toEqual([CH.kiwi2]);
  });

  it('cost boundary: a cost 6 {Straw Hat Crew} Character is not offered', () => {
    const g = play([CH.franky6, CH.franky5]);
    expect(offeredIds(g)).toEqual([CH.franky5]);
  });

  it('a Character with neither type (Marco) is not offered', () => {
    const g = play([CH.marco3, CH.kiwi2]);
    expect(offeredIds(g)).toEqual([CH.kiwi2]);
  });

  it('"type card": a {Straw Hat Crew} Stage in hand (Merry Go, cost 2) can be played', () => {
    const g = play([STG.merry]);
    expect(offeredIds(g)).toEqual([STG.merry]);
    pickCards(g, [STG.merry]);
    expect(cardIds(g, 'p1', 'stage')).toEqual([STG.merry]);
  });

  it('"up to 1": nothing may be played and the card stays in hand', () => {
    const g = play([CH.franky5]);
    skipPick(g);
    expect(cardIds(g, 'p1', 'hand')).toEqual([CH.franky5]);
  });

  it('only 1 is played even with two candidates in hand', () => {
    const g = play([CH.franky5, CH.kiwi2]);
    pickCards(g, [CH.kiwi2]);
    expect(choices(g)).toEqual([]);
    expect(cardIds(g, 'p1', 'hand')).toEqual([CH.franky5]);
  });

  it('with no candidate in hand the play finds nothing and the game continues', () => {
    const g = play([CH.marco3]);
    if (kind(g) === 'choose') skipPick(g);
    expect(atMain(g)).toBe(true);
    expect(cardIds(g, 'p1', 'hand')).toEqual([CH.marco3]);
  });
});

describe('OP18-034 Franky: Then, if you have a Stage with a cost of 5 or more, rest up to 1 opposing Character (cost 6 or less)', () => {
  it('happy path: with Birdcage (cost 5) on the field, an opposing cost 6 Character is rested', () => {
    const g = thenPart({ stage: STG.birdcage }, [CH.thatch6]);
    const thatch = g.find('p2', 'characters', CH.thatch6);
    expect(choices(g)).toEqual([thatch]);
    pickInst(g, [thatch]);
    expect(g.card(thatch).rested).toBe(true);
    expect(atMain(g)).toBe(true);
  });

  it('a cost 6 Stage (The Ark Noah) also satisfies "5 or more"', () => {
    const g = thenPart({ stage: STG.ark }, [CH.kingdew5]);
    pickInst(g, [g.find('p2', 'characters', CH.kingdew5)]);
    expect(g.card(g.find('p2', 'characters', CH.kingdew5)).rested).toBe(true);
  });

  it('a Stage with cost 3 (Galley-La Company) does not satisfy it: nothing is asked or rested', () => {
    const g = thenPart({ stage: STG.galley }, [CH.kingdew5]);
    if (kind(g) === 'choose') skipPick(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.find('p2', 'characters', CH.kingdew5)).rested).toBe(false);
  });

  it('no Stage at all: nothing is rested', () => {
    const g = thenPart({}, [CH.kingdew5]);
    if (kind(g) === 'choose') skipPick(g);
    expect(g.card(g.find('p2', 'characters', CH.kingdew5)).rested).toBe(false);
  });

  it('cost boundary: a cost 7 Character is not offered, a cost 6 one is', () => {
    const g = thenPart({ stage: STG.birdcage }, [CH.thatch6, 'OP02-020']);
    expect(choices(g)).toEqual([g.find('p2', 'characters', CH.thatch6)]);
  });

  it('the opposing Leader is not a target (Characters only)', () => {
    const g = thenPart({ stage: STG.birdcage }, [CH.thatch6]);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('"up to 1": the rest may be skipped', () => {
    const g = thenPart({ stage: STG.birdcage }, [CH.thatch6]);
    skipPick(g);
    expect(g.card(g.find('p2', 'characters', CH.thatch6)).rested).toBe(false);
  });

  it('only 1 Character is rested even with two eligible', () => {
    const g = thenPart({ stage: STG.birdcage }, [CH.thatch6, CH.kingdew5]);
    pickInst(g, [g.find('p2', 'characters', CH.kingdew5)]);
    expect(g.card(g.find('p2', 'characters', CH.thatch6)).rested).toBe(false);
    expect(g.card(g.find('p2', 'characters', CH.kingdew5)).rested).toBe(true);
  });

  it('the rest does not depend on having played a card: skipping the play still rests', () => {
    const g = play([CH.franky5], { stage: STG.birdcage }, [CH.thatch6]);
    skipPick(g);
    pickInst(g, [g.find('p2', 'characters', CH.thatch6)]);
    expect(g.card(g.find('p2', 'characters', CH.thatch6)).rested).toBe(true);
    expect(cardIds(g, 'p1', 'hand')).toEqual([CH.franky5]);
  });
});
