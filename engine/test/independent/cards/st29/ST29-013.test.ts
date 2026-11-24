/**
 * ST29-013 Rob Lucci (Character, Yellow, cost 5, 6000, Counter +1000, {CP0}/{Egghead}).
 *
 * Card text: no effect text. "[Trigger] K.O. up to 1 of your opponent's Characters with a cost equal
 * to or less than the total of your and your opponent's Life cards."
 *
 * Rules: the cost limit is the sum of BOTH players' Life cards when the Trigger resolves. Whether the
 * Life card being revealed (already taken out of the Life area, CR 10-1-5-3 "in no area") still counts
 * is not stated anywhere in the docs, so the boundary tests below assert only what both readings
 * share: a limit of N or N+1 where N is the sum after the card was removed. "Up to 1": none is
 * allowed. An activated Trigger that does not play the card ends in the trash.
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  C29,
  declineTrigger,
  fill,
  hand,
  hitLeader,
  ids29,
  inst,
  isMain,
  L29,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  theirs,
} from './kit-st29a.ts';

const ID = 'ST29-013';
const SHIKI8 = 'OP12-005'; // Red, cost 8, 10000, vanilla
const MIHAWK9 = 'OP01-070'; // Blue, cost 9, 9000, [On Play] only (never played here)

/** p2 hits my Leader; my top Life card is Lucci and the rest of my Life is `restLife` cards. */
function hit(restLife: number, p2life: number, p2chars: string[], p1chars: string[] = []) {
  const g = theirs(
    L29.croc,
    { life: [ID, ...fill(C29.c1, restLife)], characters: p1chars },
    { life: fill(C29.c1, p2life), characters: p2chars },
  );
  hitLeader(g);
  need(g, 'trigger', 'p1');
  return g;
}

describe('ST29-013 Rob Lucci [Trigger]: K.O. up to 1 Character with cost <= total Life of both players', () => {
  it('printed values: cost 5, 6000 power, Counter +1000', () => {
    const g = mine(L29.croc, { hand: [ID] });
    const c = inst(g, 'p1', 'hand', ID);
    expect(g.card(c).cost).toBe(5);
    expect(g.card(c).power).toBe(6000);
    expect(g.card(c).counter).toBe(1000);
  });

  it('with 3 more Life of mine and 4 of theirs (limit 7 or 8): costs 1..7 are offered, cost 9 is not', () => {
    const g = hit(3, 4, [C29.c1, C29.c4, C29.c7, MIHAWK9]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c1, C29.c4, C29.c7].sort());
  });

  it('the limit really is a total of both Life counts: my Life alone (5) reaches cost 5 but not cost 7', () => {
    const g = hit(5, 0, [C29.c5, C29.c7]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c5]);
  });

  it("the opponent's Life alone (5) counts too: cost 5 offered, cost 7 not", () => {
    const g = hit(0, 5, [C29.c5, C29.c7]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c5]);
  });

  it('with almost no Life (1 or 2 in total) a cost-1 Character is a target and a cost-3 Character is not', () => {
    const g = hit(0, 1, [C29.c1, C29.c3]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(C29.c1);
    expect(offeredIds(g)).not.toContain(C29.c3);
  });

  it('with a large total (15 or 16) both a cost-8 and a cost-9 Character are offered', () => {
    const g = hit(9, 6, [SHIKI8, MIHAWK9]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    // 9 (or 10) + 6 = 15 or 16: both targets qualify.
    expect(offeredIds(g)).toEqual([SHIKI8, MIHAWK9].sort());
  });

  it('K.O.s the chosen Character; Lucci is not played and ends in the trash; no card goes to my hand', () => {
    const g = hit(3, 4, [C29.c4, C29.c1]);
    activateTrigger(g);
    pickInst(g, [inst(g, 'p2', 'characters', C29.c4)]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    expect(ids29(g, 'p2', 'trash')).toEqual([C29.c4]);
    expect(ids29(g, 'p1', 'trash')).toEqual([ID]);
    expect(ids29(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([]);
    expect(isMain(g, 'p2')).toBe(true);
  });

  it('"up to 1": K.O. nothing and Lucci still ends in the trash', () => {
    const g = hit(3, 4, [C29.c1]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    expect(ids29(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('only opposing Characters are targets: my own Characters are never offered', () => {
    const g = hit(3, 4, [C29.c2], [C29.c1, C29.c3]);
    activateTrigger(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C29.c2]);
  });

  it('declining the [Trigger] adds Lucci to my hand and K.O.s nothing; played from hand he has no effect', () => {
    const g = hit(3, 4, [C29.c1]);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(ids29(g, 'p2', 'characters')).toEqual([C29.c1]);
    const h = mine(L29.croc, { hand: [ID] }, { characters: [C29.c1] });
    playRaw(h, ID);
    expect(isMain(h, 'p1')).toBe(true);
    expect(ids29(h, 'p2', 'characters')).toEqual([C29.c1]);
  });
});
