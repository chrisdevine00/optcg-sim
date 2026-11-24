/**
 * EB03-038 Thanks for the Treat. ♡ (Event, Purple, cost 1, {The Vinsmoke Family}/{GERMA 66}).
 *
 * Card text: "[Main] You may rest 1 of your DON!! cards: If the number of DON!! cards on your field
 * is equal to or less than the number on your opponent's field and you only have Characters with
 * a type including "GERMA", add up to 2 DON!! cards from your DON!! deck and rest them.
 * [Counter] Your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1 (a "you may" cost is all or nothing and may be declined, RL-52), CR 4-8-1 ("up
 * to"), CR 2-4-3 / type "including" (substring match), CR 3-9 (DON!! on the field, rested ones
 * included). With no Characters at all, "you only have Characters with ..." is not asserted: the
 * M6b-Q21 / E-Q4 family leaves that reading open for this wording.
 */
import { describe, expect, it } from 'vitest';
import { attack } from '../../helpers.ts';
import {
  addDonAnswer,
  answerMay,
  atMain,
  block,
  C14,
  canCounterNow,
  chars,
  donCountOptions,
  donSum,
  inst,
  kind,
  LB,
  mine,
  mustBeUnpayable,
  need,
  put,
  settle,
  takeDon,
  theirs,
  useCounter,
  passBlock,
  BLUE,
} from './kit-eb03b.ts';

const ID = 'EB03-038';
const NIJI = 'OP11-045'; // {The Vinsmoke Family}/{GERMA 66}, cost 5, 6000, vanilla
const CLONE = 'OP10-064'; // {The Vinsmoke Family}/{Kingdom of GERMA}, cost 2, 2000, [Blocker]
const MARCO = C14.marco; // no GERMA type

function start(o: {
  mineDon?: { active: number; rested: number };
  oppDon?: number;
  mine?: (string | { card: string; don: number })[];
  donDeck?: number;
}) {
  return mine(
    LB.shanks,
    {
      hand: [ID],
      characters: o.mine ?? [NIJI],
      costArea: o.mineDon ?? { active: 5, rested: 0 },
      ...(o.donDeck !== undefined ? { donDeck: o.donDeck } : {}),
    },
    { costArea: { active: o.oppDon ?? 5, rested: 0 } },
  );
}

/** Play the Event, accept the rest-1-DON!! cost; leaves the DON!! count (or Main) pending. */
function pay(g: ReturnType<typeof start>) {
  put(g, ID);
  answerMay(g, true);
  settle(g, { cost: 'don' });
}

describe("EB03-038 Thanks for the Treat. ♡: [Main] rest 1 DON!!: if DON!! <= the opponent's and only GERMA Characters, add up to 2 DON!! rested; [Counter] Leader +3000", () => {
  it('equal DON!! and only {GERMA 66} Characters: adds 2 DON!! from the DON!! deck, rested', () => {
    const g = start({});
    const before = donSum(g);
    pay(g);
    addDonAnswer(g, 2);
    expect(atMain(g)).toBe(true);
    const d = donSum(g);
    expect(d.deck).toBe(before.deck - 2);
    // 5 active: 1 paid the Event, 1 rested for the cost, then 2 added rested.
    expect(d.active).toBe(3);
    expect(d.rested).toBe(4);
  });

  it('a type merely including "GERMA" counts: {Kingdom of GERMA} and {GERMA 66} together are fine', () => {
    const g = start({ mine: [NIJI, CLONE] });
    const before = donSum(g);
    pay(g);
    addDonAnswer(g, 2);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck - 2);
  });

  it('one non-GERMA Character among GERMA ones: nothing is added', () => {
    const g = start({ mine: [NIJI, MARCO] });
    const before = donSum(g);
    pay(g);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck);
    // The cost was still paid: one DON!! is rested for it.
    expect(donSum(g).rested).toBe(2);
  });

  it('fewer DON!! than the opponent: adds 2', () => {
    const g = start({ mineDon: { active: 4, rested: 0 }, oppDon: 7 });
    const before = donSum(g);
    pay(g);
    addDonAnswer(g, 2);
    expect(donSum(g).deck).toBe(before.deck - 2);
  });

  it('one more DON!! than the opponent: nothing is added (rested DON!! stay on the field, so paying the cost cannot change the comparison)', () => {
    const g = start({ mineDon: { active: 5, rested: 1 }, oppDon: 5 });
    const before = donSum(g);
    pay(g);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck);
  });

  it('"up to 2": the count asked offers 2, 1 and 0; taking 1 adds exactly 1', () => {
    const g = start({});
    const before = donSum(g);
    pay(g);
    expect(donCountOptions(g)).toEqual(['2', '1', '0']);
    takeDon(g, 1);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck - 1);
    expect(donSum(g).rested).toBe(3);
  });

  it('declining the cost: the Event is spent but nothing is rested and nothing is added', () => {
    const g = start({});
    const before = donSum(g);
    put(g, ID);
    answerMay(g, false);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck);
    expect(donSum(g).rested).toBe(1);
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('with no active DON!! left to rest after playing the Event, the cost is unpayable and nothing is added', () => {
    const g = start({ mineDon: { active: 1, rested: 4 }, oppDon: 5 });
    const before = donSum(g);
    put(g, ID);
    mustBeUnpayable(g);
    expect(atMain(g)).toBe(true);
    expect(donSum(g).deck).toBe(before.deck);
    expect(donSum(g).rested).toBe(5);
  });

  it('[Counter]: my Leader gains +3000 during the battle, which turns a lethal-sized hit into a miss, and the boost ends with the battle', () => {
    const g = theirs(
      LB.shanks,
      { hand: [ID], life: [BLUE, BLUE, BLUE, BLUE], costArea: { active: 3, rested: 0 } },
      {
        costArea: { active: 3, rested: 0 },
      },
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    const ev = g.find('p1', 'hand', ID);
    expect(canCounterNow(g, ev)).toBe(true);
    useCounter(g, ev, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(8000);
    // Finish the battle: the 5000 attack against 8000 does nothing.
    if (kind(g) === 'counter') g.act({ type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
    void block;
  });

  it('[Counter] does not run the [Main] part: no DON!! is added when it is used as a Counter', () => {
    const g = theirs(
      LB.shanks,
      { hand: [ID], costArea: { active: 3, rested: 0 }, characters: [NIJI] },
      {
        costArea: { active: 3, rested: 0 },
      },
    );
    const before = donSum(g);
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    expect(donSum(g).deck).toBe(before.deck);
    void chars;
    void inst;
  });
});
