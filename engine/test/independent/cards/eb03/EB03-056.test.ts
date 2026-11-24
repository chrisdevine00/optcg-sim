/**
 * EB03-056 Belo Betty (Character, Yellow, cost 4, 3000, Counter +2000, {Revolutionary Army}).
 *
 * Card text: "[On Play] You may turn 1 card from the top of your Life cards face-up: K.O. up to 1 of
 * your opponent's Characters with a base cost of 3 or less."
 *
 * Rules: CR 8-3-1 (all-or-nothing "you may" cost), CR 4-8-1 ("up to"), CR 4-9 (base cost), M4b-3
 * (closed 2026-11-16, official OP15-114 Q&A: the cost is unpayable when the top Life card is
 * already face-up), CR 3-10-2 (face-up Life).
 */
import { describe, expect, it } from 'vitest';
import { act } from '../../helpers.ts';
import {
  answerMay,
  atMain,
  BLUE,
  C14,
  canFinish,
  chars,
  LB,
  LD,
  mine,
  mustBeUnpayable,
  need,
  offeredIds,
  pickCards,
  put,
  trash,
} from './kit-eb03b.ts';

const ID = 'EB03-056';
const MOHJI = 'OP02-060'; // cost 1
const MARCO = 'OP01-023'; // cost 3
const HAJRUDIN = C14.hajrudin; // cost 4
const RODO = 'OP17-094'; // base cost 1; +12 cost under an {Elbaph} Leader

function start(o: {
  life?: (string | { card: string; faceUp: boolean })[];
  p2?: string[];
  p2Leader?: string;
}) {
  return mine(
    LB.luffy,
    {
      hand: [ID],
      life: o.life ?? [BLUE, BLUE, BLUE, BLUE],
      costArea: { active: 10, rested: 0 },
    },
    { characters: o.p2 ?? [] },
    o.p2Leader,
  );
}

const faceUps = (g: ReturnType<typeof start>) => g.zone('p1', 'life').map((c) => c.faceUp);

describe('EB03-056 Belo Betty: [On Play] you may turn the top Life card face-up: K.O. up to 1 Character with base cost 3 or less', () => {
  it('turns the top Life card face-up and K.O.s a Character with cost 3', () => {
    const g = start({ p2: [MARCO, HAJRUDIN] });
    put(g, ID);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    pickCards(g, [MARCO]);
    expect(atMain(g)).toBe(true);
    expect(faceUps(g)).toEqual([true, false, false, false]);
    expect(chars(g, 'p2')).toEqual([HAJRUDIN]);
    expect(trash(g, 'p2')).toEqual([MARCO]);
    expect(g.life('p1')).toBe(4);
  });

  it("the targets are the opponent's Characters with base cost 3 or less: cost 4 is not offered", () => {
    const g = start({ p2: [MOHJI, MARCO, HAJRUDIN] });
    put(g, ID);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([MOHJI, MARCO].sort());
  });

  it('"base cost": a base-cost-1 Character whose current cost is 13 is still a target', () => {
    const g = start({ p2: [RODO, HAJRUDIN], p2Leader: LD.elbaph });
    expect(g.card(g.find('p2', 'characters', RODO)).cost).toBe(13);
    put(g, ID);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([RODO]);
    pickCards(g, [RODO]);
    expect(chars(g, 'p2')).toEqual([HAJRUDIN]);
  });

  it('the cost is unpayable when the top Life card is already face-up, even if lower ones are face-down: nothing happens', () => {
    const g = start({
      life: [{ card: BLUE, faceUp: true }, BLUE, BLUE],
      p2: [MARCO],
    });
    put(g, ID);
    mustBeUnpayable(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([MARCO]);
    expect(faceUps(g)).toEqual([true, false, false]);
  });

  it('only the top card matters: a face-up card below a face-down top card does not block the cost', () => {
    const g = start({
      life: [BLUE, { card: BLUE, faceUp: true }, BLUE],
      p2: [MARCO],
    });
    put(g, ID);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    pickCards(g, [MARCO]);
    expect(faceUps(g)).toEqual([true, true, false]);
    expect(chars(g, 'p2')).toEqual([]);
  });

  it('with no Life cards the cost cannot be paid', () => {
    const g = start({ life: [], p2: [MARCO] });
    put(g, ID);
    mustBeUnpayable(g);
    expect(atMain(g)).toBe(true);
    expect(chars(g, 'p2')).toEqual([MARCO]);
  });

  it("declining the cost: the Life card stays face-down and nothing is K.O.'d", () => {
    const g = start({ p2: [MARCO] });
    put(g, ID);
    answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(faceUps(g)).toEqual([false, false, false, false]);
    expect(chars(g, 'p2')).toEqual([MARCO]);
  });

  it('"up to 1": choosing no target still pays the cost (the Life card is face-up)', () => {
    const g = start({ p2: [MARCO] });
    put(g, ID);
    answerMay(g, true);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(atMain(g)).toBe(true);
    expect(faceUps(g)[0]).toBe(true);
    expect(chars(g, 'p2')).toEqual([MARCO]);
  });

  it("at most one Character is K.O.'d", () => {
    const g = start({ p2: [MOHJI, MARCO] });
    put(g, ID);
    answerMay(g, true);
    pickCards(g, [MARCO]);
    expect(chars(g, 'p2')).toEqual([MOHJI]);
  });
});
