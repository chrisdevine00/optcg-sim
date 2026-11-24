/**
 * ST32-001 Kin'emon (Green Character, cost 1, 2000, Counter +1000, Slash, {Land of Wano}/{The Akazaya Nine}).
 *
 * Card text: "[On Play] You may rest your <Slash> attribute Leader or 1 of your DON!! cards: Draw 2 cards
 * and trash 1 card from your hand."
 *
 * Rules: RD 120 (an unpayable cost cannot be paid at all), CR 6-5-4 (rest cost), draw then trash.
 * The engine asks "choose how to pay" (Leader or DON!!) as a `mode` choose when both can pay.
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  atMain,
  BLUE,
  cardIds,
  deck,
  don,
  fill,
  hand,
  LDB,
  mine,
  need,
  no,
  optionLabels,
  pickInst,
  playRaw,
  restVia,
  SB,
  T,
  trash,
  unusable,
  yes,
} from './kit-stb5b.ts';

const TOP = [SB.c3p5, SB.c4p6];

function setup(leader: string | { card: string; rested: boolean }, spec: Partial<PlayerSpec> = {}) {
  return mine(leader, {
    hand: [T.kinemon, SB.c1p3],
    deck: [...TOP, ...fill(BLUE, 13)],
    ...spec,
  });
}

describe("ST32-001 Kin'emon: [On Play] may rest a Slash Leader or 1 DON!!: draw 2, trash 1", () => {
  it('rest the Slash Leader: it is rested, 2 cards are drawn, 1 trashed (net +1)', () => {
    const g = setup(LDB.slash);
    playRaw(g, T.kinemon);
    yes(g);
    restVia(g, 'leader');
    const d = need(g, 'choose');
    expect(d.min).toBe(1);
    expect(d.max).toBe(1);
    expect(hand(g)).toEqual([SB.c1p3, ...TOP].sort());
    pickInst(g, [g.find('p1', 'hand', SB.c1p3)]);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(hand(g)).toEqual([...TOP].sort());
    expect(trash(g)).toEqual([SB.c1p3]);
    expect(deck(g)).toHaveLength(13);
    // The Leader, not a DON!!, paid: only the DON!! that paid the play cost is rested.
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
  });

  it('rest 1 DON!! instead: the Leader stays active and one more DON!! is rested', () => {
    const g = setup(LDB.slash);
    playRaw(g, T.kinemon);
    yes(g);
    restVia(g, 'don');
    pickInst(g, [g.find('p1', 'hand', SB.c1p3)]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
    expect(hand(g)).toEqual([...TOP].sort());
  });

  it('with a Slash Leader the payment may be either the Leader or a DON!!', () => {
    const g = setup(LDB.slash);
    playRaw(g, T.kinemon);
    yes(g);
    const labels = optionLabels(g);
    expect(labels).toHaveLength(2);
    expect(labels.some((l) => /DON/.test(l))).toBe(true);
    expect(labels.some((l) => !/DON/.test(l))).toBe(true);
  });

  it('a Leader without the Slash attribute cannot pay: only a DON!! is rested', () => {
    const g = setup(LDB.strike);
    playRaw(g, T.kinemon);
    yes(g);
    // Either no question (one way to pay) or a question that offers only DON!!.
    for (const l of optionLabels(g)) expect(l).toMatch(/DON/);
    restVia(g, 'don');
    pickInst(g, [g.find('p1', 'hand', SB.c1p3)]);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
    expect(deck(g)).toHaveLength(13);
  });

  it('RD 120: non-Slash Leader and no active DON!! left: the cost cannot be paid and nothing is drawn', () => {
    const g = setup(LDB.strike, { costArea: { active: 1, rested: 0 } });
    playRaw(g, T.kinemon);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(15);
    expect(hand(g)).toEqual([SB.c1p3]);
  });

  it('RD 120: an already rested Slash Leader and no active DON!!: unpayable', () => {
    const g = setup({ card: LDB.slash, rested: true }, { costArea: { active: 1, rested: 0 } });
    playRaw(g, T.kinemon);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(deck(g)).toHaveLength(15);
  });

  it('a Slash Leader pays when no DON!! is active', () => {
    const g = setup(LDB.slash, { costArea: { active: 1, rested: 0 } });
    playRaw(g, T.kinemon);
    yes(g);
    restVia(g, 'leader');
    pickInst(g, [g.find('p1', 'hand', SB.c1p3)]);
    expect(g.card(g.leader('p1')).rested).toBe(true);
    expect(deck(g)).toHaveLength(13);
  });

  it('the card trashed may be one of the cards just drawn', () => {
    const g = setup(LDB.slash);
    playRaw(g, T.kinemon);
    yes(g);
    restVia(g, 'leader');
    need(g, 'choose');
    pickInst(g, [g.find('p1', 'hand', SB.c4p6)]);
    expect(hand(g)).toEqual([SB.c1p3, SB.c3p5].sort());
    expect(trash(g)).toEqual([SB.c4p6]);
  });

  it('declining the "you may": nothing is rested, drawn or trashed', () => {
    const g = setup(LDB.slash);
    playRaw(g, T.kinemon);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).rested).toBe(false);
    expect(don(g)).toMatchObject({ active: 9, rested: 1 });
    expect(deck(g)).toHaveLength(15);
    expect(hand(g)).toEqual([SB.c1p3]);
    expect(trash(g)).toEqual([]);
  });

  it('the draw is exactly 2: the two top cards of the deck', () => {
    const g = setup(LDB.slash);
    playRaw(g, T.kinemon);
    yes(g);
    restVia(g, 'leader');
    pickInst(g, [g.find('p1', 'hand', SB.c1p3)]);
    expect(cardIds(g, 'p1', 'deck')[0]).toBe(BLUE);
    expect(hand(g)).toEqual([...TOP].sort());
  });
});
