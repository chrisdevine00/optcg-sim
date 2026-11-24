/**
 * OP11-080 Gear Two (Event, Purple, cost 1, {Straw Hat Crew}).
 *
 * Card text: "[Main] You may rest 2 of your DON!! cards: If your Leader's colors include blue, add up
 * to 1 DON!! card from your DON!! deck and rest it.
 * [Counter] Up to 1 of your Leader gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1-4 ("you may" cost: if unpaid, the effect after the colon does not happen), CR 2-5
 * (a DON!! rested as a cost must be active), E-Q11 ("add up to N DON!!" asks a count), CR 7-1 (battle).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  addDon,
  asksCount,
  at,
  attack,
  dn,
  kind,
  LD11,
  lifeCards,
  me,
  need,
  no,
  passBlock,
  passCounter,
  payDonIfAsked,
  playRaw,
  SC11,
  them,
  unusable,
  yes,
  cnt,
  countOptions,
} from './kit-op11c.ts';

const ID = 'OP11-080';
/** OP05-041 Sakazuki: Blue/Black Leader, {Navy}. Colors include blue. */
const BLUE_BLACK = 'OP05-041';

function main(leader: string, o: { active?: number; rested?: number; donDeck?: number } = {}) {
  return me(leader, {
    hand: [ID],
    costArea: { active: o.active ?? 5, rested: o.rested ?? 0 },
    ...(o.donDeck !== undefined ? { donDeck: o.donDeck } : {}),
  });
}

/** Play the Event and say yes to the "rest 2 DON!!" cost; stops at the first decision after paying. */
function playAndPay(g: ReturnType<typeof main>) {
  playRaw(g, ID);
  yes(g, 'p1');
  payDonIfAsked(g, 2);
}

describe('OP11-080 Gear Two: rest 2 DON!!, blue Leader adds 1 rested DON!!; [Counter] Leader +3000', () => {
  it('printed [Main]: blue Leader, pay by resting 2 DON!!: add 1 DON!! from the deck, rested', () => {
    const g = main(LD11.blue);
    const before = dn(g);
    playAndPay(g);
    expect(asksCount(g)).toBe(true);
    addDon(g, 1);
    const after = dn(g);
    expect(after.deck).toBe(before.deck - 1);
    // 5 active - 1 (event cost) - 2 (rested as cost) = 2 active; rested 1 + 2 + the new rested one.
    expect(after.active).toBe(2);
    expect(after.rested).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('a Leader with blue among its colors counts (Blue/Black Sakazuki)', () => {
    const g = main(BLUE_BLACK);
    playAndPay(g);
    addDon(g, 1);
    expect(dn(g).rested).toBe(4);
  });

  it('a Leader without blue adds no DON!! even though the cost was paid', () => {
    const g = main(LD11.plain);
    const before = dn(g);
    playAndPay(g);
    expect(dn(g).deck).toBe(before.deck);
    expect(dn(g).rested).toBe(3);
    expect(kind(g)).toBe('main');
  });

  it('"up to 1": the count question offers 0 and 1 (most first) and I may add none', () => {
    const g = main(LD11.blue);
    playAndPay(g);
    expect(asksCount(g)).toBe(true);
    expect(countOptions(g)).toEqual(['1', '0']);
    const before = dn(g).deck;
    addDon(g, 0);
    expect(dn(g).deck).toBe(before);
  });

  it('"you may": declining the cost rests no DON!! and adds none', () => {
    const g = main(LD11.blue);
    playRaw(g, ID);
    no(g, 'p1');
    const d = dn(g);
    expect(d.rested).toBe(1);
    expect(d.active).toBe(4);
    expect(kind(g)).toBe('main');
  });

  it('unpayable cost: only 2 active DON!! (1 pays the Event, 1 is left): nothing can be rested or added', () => {
    const g = main(LD11.blue, { active: 2 });
    const before = dn(g);
    playRaw(g, ID);
    unusable(g, 'p1');
    expect(dn(g).deck).toBe(before.deck);
    expect(dn(g).rested).toBe(1);
  });

  it('rested DON!! cannot pay "rest 2 of your DON!! cards": 1 active + 5 rested, the Event takes the active one', () => {
    const g = main(LD11.blue, { active: 1, rested: 5 });
    const before = dn(g);
    playRaw(g, ID);
    unusable(g, 'p1');
    expect(dn(g).deck).toBe(before.deck);
  });

  it('exactly 3 active DON!! is enough (1 for the Event, 2 rested as the cost)', () => {
    const g = main(LD11.blue, { active: 3 });
    playAndPay(g);
    addDon(g, 1);
    expect(dn(g).active).toBe(0);
    expect(dn(g).rested).toBe(4);
  });

  it('with an empty DON!! deck nothing is added and the game continues', () => {
    const g = main(LD11.blue, { active: 10, donDeck: 0 });
    playRaw(g, ID);
    yes(g, 'p1');
    payDonIfAsked(g, 2);
    if (asksCount(g)) addDon(g, 0);
    expect(dn(g).deck).toBe(0);
    expect(kind(g)).toBe('main');
  });

  describe('[Counter]', () => {
    function attacked() {
      const g = them(
        LD11.plain,
        { hand: [ID], costArea: { active: 2, rested: 0 }, characters: [SC11.r1] },
        { characters: [SC11.r5] },
      );
      attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
      passBlock(g);
      need(g, 'counter', 'p1');
      return g;
    }

    it('gives my Leader +3000 during this battle: 8000 holds against a 7000 attacker', () => {
      const g = attacked();
      const ev = g.legal().find((a) => a.type === 'activate' && a.card === at(g, 'p1', 'hand', ID));
      expect(ev).toBeDefined();
      g.act(ev!);
      if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.leader('p1') });
      expect(g.power(g.leader('p1'))).toBe(8000);
      act(g, { type: 'endCounter' });
      expect(lifeCards(g)).toHaveLength(4);
    });

    it('without it the same attack lands (control), and the boost is gone after the battle', () => {
      const g = attacked();
      const ev = g.legal().find((a) => a.type === 'activate' && a.card === at(g, 'p1', 'hand', ID));
      g.act(ev!);
      if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.leader('p1') });
      act(g, { type: 'endCounter' });
      expect(g.power(g.leader('p1'))).toBe(5000);
      const ctrl = attacked();
      passCounter(ctrl);
      expect(cnt(ctrl, 'p1', 'life')).toBe(3);
    });

    it('offers only my Leader as a target, never a Character', () => {
      const g = attacked();
      const ev = g.legal().find((a) => a.type === 'activate' && a.card === at(g, 'p1', 'hand', ID));
      g.act(ev!);
      const picks = g.legal().filter((a) => a.type === 'pick');
      for (const p of picks) {
        if (p.type === 'pick') expect(p.choice).toBe(g.leader('p1'));
      }
      if (kind(g) === 'choose') act(g, { type: 'pick', choice: g.leader('p1') });
      expect(g.power(at(g, 'p1', 'characters', SC11.r1))).toBe(3000);
    });
  });
});
