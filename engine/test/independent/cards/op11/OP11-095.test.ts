/**
 * OP11-095 Monkey.D.Garp (Character, Black, cost 8, 8000, no Counter, {Navy}).
 *
 * Card text: "[On Play] You may place 3 "Navy" type cards from your trash at the bottom of your deck
 * in any order: Give up to 1 rested DON!! card to 1 of your Leader. Then, if there is a Character
 * with a cost of 9 or more, K.O. up to 1 of your opponent's Characters with a cost of 7 or less."
 *
 * Rules: CR 8-3-1-4 ("you may" cost: unpaid = no effect), CR 8-3-2 (If, checked when the "Then"
 * resolves), CR 8-4-4 ("up to"), DON!! given to the Leader gives [DON!! xN] and +1000 power (CR 6-5-5-1).
 * Scenery: OP01-070 Mihawk (cost 9, inert on the field); OP12-005 Shiki (cost 8).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  chars,
  deckBottom,
  dn,
  kind,
  LD11,
  mayChooseNone,
  me,
  need,
  none,
  offeredIds,
  orderFirst,
  pickInst,
  playRaw,
  reachablePickSets,
  SC11,
  trash,
  unusable,
  yes,
  no,
} from './kit-op11c.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const ID = 'OP11-095';
const NAVY3 = [SC11.navyB1, SC11.navyB2, SC11.navyB3];

function start(o: { trash?: string[]; mine?: string[]; foe?: string[] } = {}) {
  const g = me(
    LD11.navy,
    {
      hand: [ID],
      characters: o.mine ?? [],
      trash: o.trash ?? [...NAVY3, SC11.r1],
      costArea: { active: 8, rested: 0 },
    },
    { characters: o.foe ?? [SC11.r7, SC11.r3] },
  );
  playRaw(g, ID);
  return g;
}

/** Say yes and pay with the 3 Navy cards (by card id), settle the order prompts. */
function pay(g: TestGame, cards: string[] = NAVY3) {
  yes(g, 'p1');
  // With exactly 3 candidates the engine may pick them itself; otherwise it asks.
  if (kind(g) === 'choose') {
    pickInst(
      g,
      cards.map((c) => at(g, 'p1', 'trash', c)),
    );
  }
  while (kind(g) === 'order') orderFirst(g, 'p1');
}

/** Give the rested DON!! to my Leader. */
function giveToLeader(g: TestGame) {
  const d = need(g, 'choose', 'p1');
  expect(d.prompt).toMatch(/give DON/i);
  pickInst(g, [g.leader('p1')]);
}

describe('OP11-095 Monkey.D.Garp: place 3 {Navy} trash cards, give a rested DON!! to my Leader, then K.O.', () => {
  it('printed effect: pay 3 {Navy} cards, DON!! goes to the Leader, a cost-9 Character makes the K.O. available', () => {
    const g = start({ mine: [SC11.c9] });
    pay(g);
    giveToLeader(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC11.r7)]);
    expect(g.zone('p2', 'characters').map((c) => c.card)).toEqual([SC11.r3]);
    expect(trash(g, 'p2')).toEqual([SC11.r7]);
    expect(kind(g)).toBe('main');
  });

  it('cost: the 3 chosen cards leave the trash for the bottom of my deck', () => {
    const g = start();
    pay(g);
    expect(trash(g)).toEqual([SC11.r1]);
    expect(deckBottom(g, 'p1', 3).sort()).toEqual([...NAVY3].sort());
  });

  it('only {Navy} cards can pay: a non-{Navy} card in the trash is never part of a selection', () => {
    const g = start({ trash: [...NAVY3, SC11.navyB4, SC11.r1] });
    yes(g, 'p1');
    const sets = [...reachablePickSets(g)].filter((s) => s);
    expect(sets).toHaveLength(4);
    for (const s of sets) expect(s.split('+')).not.toContain(SC11.r1);
  });

  it('unpayable: only 2 {Navy} cards (and a non-{Navy} one) in the trash: nothing happens', () => {
    const g = start({ trash: [SC11.navyB1, SC11.navyB2, SC11.r1], mine: [SC11.c9] });
    unusable(g, 'p1');
    expect(trash(g)).toHaveLength(3);
    expect(dn(g).given).toBe(0);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('"you may": declining the cost does nothing at all (no DON!!, no K.O.)', () => {
    const g = start({ mine: [SC11.c9] });
    no(g, 'p1');
    expect(trash(g)).toHaveLength(4);
    expect(dn(g).given).toBe(0);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
    expect(kind(g)).toBe('main');
  });

  it('gives 1 rested DON!! to my Leader: one fewer rested DON!! in the cost area, 1 given, Leader +1000', () => {
    const g = start();
    const before = dn(g);
    pay(g);
    giveToLeader(g);
    const after = dn(g);
    expect(after.given).toBe(before.given + 1);
    expect(after.rested).toBe(before.rested - 1);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('"up to 1": I may give the DON!! to nobody', () => {
    const g = start();
    pay(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(dn(g).given).toBe(0);
  });

  it('without any Character of cost 9 or more the K.O. does not happen (Garp himself is cost 8)', () => {
    const g = start({ mine: [SC11.r8] });
    pay(g);
    giveToLeader(g);
    expect(kind(g)).toBe('main');
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });

  it('"a Character": a cost-9 Character on the opponent’s side also satisfies the condition', () => {
    const g = start({ foe: [SC11.c9, SC11.r7, SC11.r3] });
    pay(g);
    giveToLeader(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g).sort()).toEqual([SC11.r3, SC11.r7].sort());
    pickInst(g, [at(g, 'p2', 'characters', SC11.r7)]);
    expect(chars(g, 'p2')).toEqual([SC11.c9, SC11.r3].sort());
  });

  it('K.O. targets: cost 7 is offered, cost 8 is not, and never my own Characters', () => {
    const g = start({ mine: [SC11.c9, SC11.r2], foe: [SC11.r8, SC11.r7] });
    pay(g);
    giveToLeader(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC11.r7]);
  });

  it('K.O. is "up to 1": I may K.O. nobody', () => {
    const g = start({ mine: [SC11.c9] });
    pay(g);
    giveToLeader(g);
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(g.zone('p2', 'characters')).toHaveLength(2);
  });
});
