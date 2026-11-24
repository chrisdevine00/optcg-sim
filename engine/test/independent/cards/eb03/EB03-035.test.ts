/**
 * EB03-035 Charlotte Pudding (Character, Purple, cost 4, 4000, Counter +2000, {Big Mom Pirates}).
 *
 * Card text: "[Blocker]
 * [On Play] If the number of DON!! cards on your field is equal to or less than the number on your
 * opponent's field, add up to 1 DON!! card from your DON!! deck and rest it."
 *
 * Rules: CR 4-8-1 ("up to"), CR 3-9 (DON!! on the field: cost area plus DON!! given to cards),
 * CR 6-5-5 (DON!! cost: rested, not removed from the field).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, blockers } from '../../helpers.ts';
import {
  addDonAnswer,
  atMain,
  BLUE,
  C14,
  donCountOptions,
  donSum,
  LB,
  mine,
  need,
  put,
  takeDon,
  theirs,
} from './kit-eb03b.ts';

const ID = 'EB03-035';

/** p1 with Pudding in hand and `mineDon` DON!! in the cost area against `oppDon` on p2's field. */
function start(o: {
  mineDon?: number;
  oppDon?: number;
  given?: number;
  oppGiven?: number;
  donDeck?: number;
}) {
  const mineDon = o.mineDon ?? 6;
  return mine(
    LB.luffy,
    {
      hand: [ID],
      characters: o.given ? [{ card: C14.marco, don: o.given }] : [],
      costArea: { active: mineDon, rested: 0 },
      ...(o.donDeck !== undefined ? { donDeck: o.donDeck } : {}),
    },
    {
      costArea: { active: o.oppDon ?? 6, rested: 0 },
      characters: o.oppGiven ? [{ card: C14.marco, don: o.oppGiven }] : [],
    },
  );
}

describe("EB03-035 Charlotte Pudding: [Blocker]; [On Play] if my DON!! <= the opponent's, add up to 1 DON!! rested", () => {
  it('equal DON!! counts: adds 1 DON!! from the DON!! deck, rested', () => {
    const g = start({ mineDon: 6, oppDon: 6 });
    const before = donSum(g);
    put(g, ID);
    addDonAnswer(g, 1);
    expect(atMain(g)).toBe(true);
    const after = donSum(g);
    expect(after.deck).toBe(before.deck - 1);
    // 6 active, 4 rested to pay for Pudding, then 1 added rested.
    expect(after.active).toBe(2);
    expect(after.rested).toBe(5);
  });

  it('fewer DON!! than the opponent: adds 1 DON!!', () => {
    const g = start({ mineDon: 5, oppDon: 8 });
    const before = donSum(g);
    put(g, ID);
    addDonAnswer(g, 1);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck - 1);
    expect(donSum(g).rested).toBe(5);
  });

  it('one more DON!! than the opponent: nothing is added (the condition is checked at the boundary)', () => {
    const g = start({ mineDon: 7, oppDon: 6 });
    const before = donSum(g);
    put(g, ID);
    // The condition fails, so there is nothing to ask: straight back to the Main Phase.
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck);
    expect(donSum(g).rested).toBe(4);
    expect(donSum(g).active).toBe(3);
  });

  it('playing the card rests DON!! but they stay on the field: 6 vs 6 still counts as equal after paying the cost', () => {
    const g = start({ mineDon: 6, oppDon: 6 });
    put(g, ID);
    addDonAnswer(g, 1);
    // If resting the 4 cost DON!! were counted as leaving the field, the count would be lower, and
    // the add would still happen; the opposite error (adding when ahead) is covered above. Here the
    // total on the field must be exactly 7.
    const d = donSum(g);
    expect(d.active + d.rested + d.given).toBe(7);
  });

  it('DON!! given to my Characters count as on my field: 6 in the cost area + 1 given vs 6 is more, so nothing is added', () => {
    const g = start({ mineDon: 6, oppDon: 6, given: 1 });
    const before = donSum(g);
    expect(before.given).toBe(1);
    put(g, ID);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck);
  });

  it("DON!! given to the opponent's Characters count on their field: 5 vs 4 + 1 given is equal, so 1 is added", () => {
    const g = start({ mineDon: 5, oppDon: 4, oppGiven: 1 });
    const before = donSum(g);
    put(g, ID);
    addDonAnswer(g, 1);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck - 1);
  });

  it('with an empty DON!! deck nothing can be added and nothing breaks', () => {
    const g = start({ mineDon: 10, oppDon: 10, donDeck: 0 });
    put(g, ID);
    // Whether a count is asked with 0 available is the engine's choice; an answer of 0 or no
    // prompt must both leave the field as it was.
    if (!atMain(g)) addDonAnswer(g, 0);
    expect(atMain(g)).toBe(true);
    const d = donSum(g);
    expect(d.deck).toBe(0);
    expect(d.active + d.rested + d.given).toBe(10);
  });

  it('"up to 1": the count asked offers 1 and 0, and 0 adds nothing', () => {
    const g = start({ mineDon: 6, oppDon: 6 });
    const before = donSum(g);
    put(g, ID);
    // Convention: "add up to N DON!!" asks a count, most first.
    expect(donCountOptions(g)).toEqual(['1', '0']);
    takeDon(g, 0);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck);
    expect(donSum(g).rested).toBe(4);
  });

  it("[Blocker]: on the opponent's turn it can block an attack aimed at my Leader", () => {
    const g = theirs(LB.luffy, { characters: [ID], life: [BLUE, BLUE, BLUE, BLUE] }, {});
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    const pudding = g.find('p1', 'characters', ID);
    expect(blockers(g)).toContain(pudding);
    act(g, { type: 'block', blocker: pudding });
    // The attack is on Pudding now (4000 against a 5000 Leader): no Life is lost.
    expect(g.life('p1')).toBe(4);
  });
});
