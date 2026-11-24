/**
 * OP16-050 Miss Olive (Character, Blue, cost 5, 6000, Counter +1000, {Impel Down}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] You may return 1 of your Characters with a cost of 2 or more to the
 * owner's hand: Draw 2 cards and trash 1 card from your hand."
 *
 * Rules: CR 10-1-4 ([Blocker]), CR 8-3-1 (cost), RD 112 (optional cost), CR 4-5-3 (draw), CR 10-2-14
 * (Trash: choose from hand), RL-12 (an effect outlives its source).
 */
import { describe, expect, it } from 'vitest';
import { attack, blockers } from '../../helpers.ts';
import {
  answerMay,
  BLUE,
  backAtMain,
  choices,
  deck,
  fill,
  hand,
  inst,
  kind,
  LDR,
  mine,
  need,
  offeredNow,
  payCost,
  pickInst,
  put,
  SCN,
  theirs,
  trash,
  canFinish,
} from './kit-op16b.ts';

const OLIVE = 'OP16-050';
const TOP = [SCN.c7, SCN.c8, ...fill(BLUE, 8)];

function start(chars: string[], handCards: string[] = [], top: string[] = TOP) {
  const g = mine(LDR.impel, { hand: [OLIVE, ...handCards], characters: chars, deck: top });
  put(g, OLIVE);
  return g;
}

describe('OP16-050 Miss Olive: [Blocker]; [On Play] return a Character with cost 2+: draw 2, trash 1 from hand', () => {
  it('has [Blocker] and blocks', () => {
    const g = theirs(LDR.luffy, { characters: [OLIVE] }, { characters: [SCN.c3] });
    expect(g.card(inst(g, 'p1', 'characters', OLIVE)).keywords).toContain('Blocker');
    attack(g, inst(g, 'p2', 'characters', SCN.c3), g.leader('p1'));
    expect(blockers(g)).toEqual([inst(g, 'p1', 'characters', OLIVE)]);
  });

  it('pay by returning a Character: draws 2, then trashes 1 card of my choice from hand', () => {
    const g = start([SCN.c3], [SCN.c1]);
    answerMay(g, true);
    payCost(g, inst(g, 'p1', 'characters', SCN.c3));
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c1)]);
    expect(backAtMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c3, SCN.c7, SCN.c8].sort());
    expect(trash(g)).toEqual([SCN.c1]);
    expect(deck(g)).toHaveLength(8);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([OLIVE]);
  });

  it('the card to trash is chosen from the whole hand: the returned Character and the drawn cards are offered', () => {
    const g = start([SCN.c3], [SCN.c1]);
    answerMay(g, true);
    payCost(g, inst(g, 'p1', 'characters', SCN.c3));
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toEqual([SCN.c1, SCN.c3, SCN.c7, SCN.c8].sort());
  });

  it('exactly 1 card must be trashed (no "done" with none chosen); trashing a drawn card works', () => {
    const g = start([SCN.c3], []);
    answerMay(g, true);
    payCost(g, inst(g, 'p1', 'characters', SCN.c3));
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(false);
    pickInst(g, [inst(g, 'p1', 'hand', SCN.c7)]);
    expect(trash(g)).toEqual([SCN.c7]);
    expect(hand(g)).toEqual([SCN.c3, SCN.c8].sort());
  });

  it('cost boundary: a cost-1 Character is not a legal cost; a cost-2 one is', () => {
    const g = start([SCN.c1, SCN.c2]);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    expect(offeredNow(g)).toContain(SCN.c2);
    expect(offeredNow(g)).not.toContain(SCN.c1);
  });

  it('Miss Olive herself is a Character with cost 5: she may be the one returned, and the draw 2 / trash 1 still happens', () => {
    const g = start([SCN.c1]);
    answerMay(g, true);
    payCost(g); // Olive is the only candidate: the engine may pay by itself or ask
    need(g, 'choose', 'p1');
    pickInst(g, [inst(g, 'p1', 'hand', OLIVE)]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([SCN.c1]);
    expect(hand(g)).toEqual([SCN.c7, SCN.c8].sort());
    expect(trash(g)).toEqual([OLIVE]);
  });

  it('declining the optional cost: nothing is returned, drawn or trashed', () => {
    const g = start([SCN.c3], [SCN.c1]);
    answerMay(g, false);
    expect(backAtMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c1]);
    expect(deck(g)).toHaveLength(10);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
  });

  it('the return is of my own Characters only: the opponent’s are not offered', () => {
    const g = mine(
      LDR.impel,
      { hand: [OLIVE], characters: [SCN.c3], deck: TOP },
      { characters: [SCN.c4] },
    );
    put(g, OLIVE);
    answerMay(g, true);
    expect(choices(g).every((i) => g.card(i).owner === 'p1')).toBe(true);
  });

  it('draws exactly 2 (deck 10 -> 8), even with an empty hand beforehand', () => {
    const g = start([SCN.c3]);
    answerMay(g, true);
    payCost(g, inst(g, 'p1', 'characters', SCN.c3));
    need(g, 'choose', 'p1');
    expect(deck(g)).toHaveLength(8);
    expect(kind(g)).toBe('choose');
  });
});
