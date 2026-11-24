/**
 * OP16-035 Roronoa Zoro (Character, Green, cost 7, 9000, no Counter, {Straw Hat Crew}, Slash).
 *
 * Card text: "[On Play] Rest up to 1 of your opponent's cards. Then, you may trash 1 card from your
 * hand. If you do, give up to 3 rested DON!! cards to your Leader."
 *
 * Rules: "cards" includes the Leader, Characters, a Stage and DON!! cards (official Q&A, M4b-1 /
 * E-Q3), "up to" (CR 8-4-4-1), "If you do" gates the DON!! step on the trash having happened (CR
 * 8-3-3), given DON!! come from the rested DON!! and stay rested (CR 6-5-5-4), "Then" runs even if
 * nothing was rested.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  atMain,
  choices,
  don,
  hand,
  kind,
  mayChooseNone,
  mine,
  need,
  no,
  none,
  OL,
  OV,
  offeredIds,
  pickInst,
  playCard,
  restedChar,
  trash,
  unusable,
  yes,
} from './kit-op16a.ts';

const ZORO = 'OP16-035';

/** p1 plays Zoro with 10 active DON!! (7 rest to pay; 7 rested DON!! afterwards). */
function start(inHand: string[], p2: Parameters<typeof mine>[2] = { characters: [OV.thatch] }) {
  const g = mine(OL.kid, { hand: [ZORO, ...inHand], costArea: { active: 10, rested: 0 } }, p2);
  playCard(g, ZORO);
  return g;
}
const pickCount = (g: ReturnType<typeof start>, n: number) =>
  act(g, { type: 'pick', choice: { option: String(n) } });

describe("OP16-035 Roronoa Zoro: [On Play] rest up to 1 of the opponent's cards", () => {
  it("offers the opponent's Leader and Characters, not mine", () => {
    const g = mine(
      OL.kid,
      { hand: [ZORO], characters: [OV.sai4], costArea: { active: 10, rested: 0 } },
      { characters: [OV.thatch] },
    );
    playCard(g, ZORO);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(g.leader('p2'));
    expect(offeredIds(g)).toContain(OV.thatch);
    expect(choices(g)).not.toContain(g.leader('p1'));
    expect(offeredIds(g)).not.toContain(OV.sai4);
  });

  it('rests the chosen Character', () => {
    const g = start([]);
    pickInst(g, [g.find('p2', 'characters', OV.thatch)]);
    expect(restedChar(g, 'p2', OV.thatch)).toBe(true);
  });

  it('may rest the opposing Leader', () => {
    const g = start([]);
    pickInst(g, [g.leader('p2')]);
    expect(g.card(g.leader('p2')).rested).toBe(true);
    expect(restedChar(g, 'p2', OV.thatch)).toBe(false);
  });

  it('"up to 1": may rest nothing', () => {
    const g = start([]);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(restedChar(g, 'p2', OV.thatch)).toBe(false);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });

  it('rests only one card', () => {
    const g = start([], { characters: [OV.thatch, OV.sai4] });
    pickInst(g, [g.find('p2', 'characters', OV.thatch)]);
    expect(restedChar(g, 'p2', OV.sai4)).toBe(false);
    expect(g.card(g.leader('p2')).rested).toBe(false);
  });
});

describe('OP16-035 Roronoa Zoro: Then you may trash 1 card: give up to 3 rested DON!! to my Leader', () => {
  /** Zoro played, the rest step skipped; stops at the "you may trash" question. */
  function afterRest(inHand: string[]) {
    const g = start(inHand);
    none(g);
    return g;
  }

  it('"Then" runs although nothing was rested: the trash question is asked', () => {
    const g = afterRest([OV.sai4]);
    need(g, 'optional', 'p1');
  });

  it('paying: trashes the chosen hand card and gives 3 rested DON!! to my Leader (they stay rested)', () => {
    const g = afterRest([OV.sai4, OV.marco5]);
    yes(g);
    pickInst(g, [g.find('p1', 'hand', OV.sai4)]);
    need(g, 'choose');
    pickCount(g, 3);
    expect(trash(g)).toEqual([OV.sai4]);
    expect(hand(g)).toEqual([OV.marco5]);
    expect(g.card(g.leader('p1')).don).toBe(3);
    expect(don(g, 'p1')).toMatchObject({ active: 3, rested: 4, given: 3 });
    expect(atMain(g)).toBe(true);
  });

  it('any card from hand may be trashed (the cost 3 Marco as well as the cost 2 Sai)', () => {
    const g = afterRest([OV.sai4, OV.marco5]);
    yes(g);
    need(g, 'choose');
    expect(offeredIds(g)).toEqual([OV.marco5, OV.sai4].sort());
  });

  it('"up to 3": offers 3, 2, 1 or none, and gives exactly the chosen number', () => {
    const g = afterRest([OV.sai4]);
    yes(g);
    pickInst(g, [g.find('p1', 'hand', OV.sai4)]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(4);
    pickCount(g, 2);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(don(g, 'p1')).toMatchObject({ rested: 5, given: 2 });
  });

  it('choosing none: the card is still trashed and no DON!! is given', () => {
    const g = afterRest([OV.sai4]);
    yes(g);
    pickInst(g, [g.find('p1', 'hand', OV.sai4)]);
    pickCount(g, 0);
    expect(trash(g)).toEqual([OV.sai4]);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('declining the trash: no card is trashed and no DON!! is given', () => {
    const g = afterRest([OV.sai4]);
    no(g);
    expect(hand(g)).toEqual([OV.sai4]);
    expect(trash(g)).toEqual([]);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(kind(g)).toBe('main');
  });

  it('with an empty hand nothing can be trashed, so no DON!! is given ("If you do")', () => {
    const g = afterRest([]);
    unusable(g, 'p1');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(atMain(g)).toBe(true);
  });

  it('the DON!! go to the Leader only, never to a Character', () => {
    const g = mine(
      OL.kid,
      { hand: [ZORO, OV.sai4], characters: [OV.marco5], costArea: { active: 10, rested: 0 } },
      { characters: [OV.thatch] },
    );
    playCard(g, ZORO);
    none(g);
    yes(g);
    pickInst(g, [g.find('p1', 'hand', OV.sai4)]);
    pickCount(g, 3);
    expect(g.card(g.find('p1', 'characters', OV.marco5)).don).toBe(0);
    expect(g.card(g.leader('p1')).don).toBe(3);
  });
});

// "Rest up to 1 of your opponent's cards" may be answered with any card the opponent has (Leader,
// Character, Stage or DON!!), and "up to 1" lets me choose which. With an opposing DON!! in the cost
// area the engine rests that DON!! at once, without a prompt.
describe("OP16-035 Roronoa Zoro: the opponent's DON!! among the candidates", () => {
  it.fails(
    'the player is asked which card to rest even when the opponent has DON!! in the cost area',
    () => {
      const g = start([], { characters: [OV.thatch], costArea: { active: 3, rested: 0 } });
      need(g, 'choose', 'p1');
      expect(offeredIds(g)).toContain(OV.thatch);
    },
  );
});
