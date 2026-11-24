/**
 * OP14-088 Miss.MerryChristmas(Drophy) (Character, Black, cost 1, 2000, Counter +2000, {Baroque Works}).
 *
 * Card text: "[On K.O.] If your Leader's type includes "Baroque Works", draw 1 card and K.O. up to 1 of
 * your opponent's Stages with a cost of 1."
 *
 * Rules: CR 10-2-17 ([On K.O.]), CR 8-4-4 ("up to"), RD 122 (a failed "If" ends the effect).
 * A Stage is K.O.'d like a Character (CR 10-2-1 "K.O." for Stages).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  BLUE,
  deckTop,
  hand,
  kind,
  LD14,
  mine,
  need,
  none,
  offeredIds,
  opponentKOs,
  pickCards,
  pickInst,
  playId,
  SC14,
  skipEmptyChoose,
  theirs,
  theyKo,
  trash,
} from './kit-op14d.ts';

const ID = 'OP14-088';

function koed(o: { leader?: string; stage?: string; myStage?: string } = {}) {
  const g = theirs(
    o.leader ?? LD14.bw,
    {
      characters: [{ card: ID, rested: true }],
      deck: deckTop([SC14.c4, SC14.c5]),
      ...(o.myStage ? { stage: o.myStage } : {}),
    },
    { ...(o.stage ? { stage: o.stage } : {}) },
  );
  theyKo(g, at(g, 'p1', 'characters', ID));
  return g;
}

describe('OP14-088 Miss.MerryChristmas(Drophy): [On K.O.] draw 1 and K.O. up to 1 opposing cost-1 Stage', () => {
  it('with a {Baroque Works} Leader: draws exactly 1 and K.O.s the opposing cost-1 Stage', () => {
    const g = koed({ stage: SC14.stage1 });
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.stage1]);
    pickCards(g, [SC14.stage1]);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC14.c4]);
    expect(g.zone('p2', 'stage')).toHaveLength(0);
    expect(trash(g, 'p2')).toEqual([SC14.stage1]);
  });

  it('cost boundary: a cost-2 Stage is not a candidate and stays; the card is still drawn', () => {
    const g = koed({ stage: SC14.stage2 });
    skipEmptyChoose(g);
    expect(hand(g)).toEqual([SC14.c4]);
    expect(g.zone('p2', 'stage').map((c) => c.card)).toEqual([SC14.stage2]);
  });

  it('with no opposing Stage at all the card is still drawn', () => {
    const g = koed();
    skipEmptyChoose(g);
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([SC14.c4]);
  });

  it('"up to 1": the Stage may be left alone; the card is still drawn', () => {
    const g = koed({ stage: SC14.stage1 });
    none(g);
    expect(hand(g)).toEqual([SC14.c4]);
    expect(g.zone('p2', 'stage').map((c) => c.card)).toEqual([SC14.stage1]);
  });

  it("only the opponent's Stage: my own cost-1 Stage is not offered and is never K.O.d", () => {
    const g = koed({ stage: SC14.stage1, myStage: SC14.stage1 });
    need(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pickCards(g, [SC14.stage1]);
    expect(g.zone('p1', 'stage')).toHaveLength(1);
    expect(g.zone('p2', 'stage')).toHaveLength(0);
  });

  it('a Leader that is not {Baroque Works}: nothing is drawn and the Stage is left alone', () => {
    const g = koed({ leader: LD14.luffy, stage: SC14.stage1 });
    expect(atMain(g, 'p2')).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(g.zone('p2', 'stage')).toHaveLength(1);
  });

  it("K.O.d by an opponent's effect: the same [On K.O.] resolves", () => {
    const g = theirs(
      LD14.bw,
      { characters: [ID], deck: deckTop([SC14.c4]) },
      { hand: ['OP09-077'], stage: SC14.stage1 },
    );
    opponentKOs(g, at(g, 'p1', 'characters', ID));
    need(g, 'choose', 'p1');
    pickCards(g, [SC14.stage1]);
    expect(hand(g)).toEqual([SC14.c4]);
    expect(g.zone('p2', 'stage')).toHaveLength(0);
    expect(kind(g)).toBe('main');
  });

  it('must not fire for a Character trashed to make room (CR 3-7-6-1): no draw, the Stage stays', () => {
    const g = mine(
      LD14.bw,
      {
        characters: [ID, SC14.c2, SC14.c2, SC14.c2, SC14.c2],
        hand: [SC14.c4],
        deck: deckTop([SC14.c5]),
      },
      { stage: SC14.stage1 },
    );
    playId(g, SC14.c4);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', ID)]);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([]);
    expect(g.zone('p2', 'stage')).toHaveLength(1);
  });

  it('does nothing while it is merely on the field or in hand (no [On Play])', () => {
    const g = theirs(LD14.bw, { hand: [ID] }, { stage: SC14.stage1 });
    expect(hand(g)).toEqual([ID]);
    expect(g.zone('p2', 'stage')).toHaveLength(1);
    expect(BLUE).toBeTruthy();
  });
});
