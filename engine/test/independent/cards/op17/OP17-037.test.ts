/**
 * OP17-037 Are You That Afraid of the New Era?! (Event, Green, cost 1, {The Four Emperors}/{Red-Haired Pirates}).
 *
 * Card text: "[Main] Look at 5 cards from the top of your deck; reveal up to 1 card with a type
 * including "Red-Haired Pirates" and add it to your hand. Then, place the rest at the bottom of
 * your deck in any order.
 * [Counter] You may rest 1 of your cards: Up to 1 of your Leader or Characters gains +3000 power
 * during this battle."
 *
 * Rules: CR 11-2-1 / 8-4-4-2 (revealing, hidden picks), CR 8-3-1-3 (a cost that cannot be paid),
 * CR 7-1-3-1-2 (Event [Counter]), RL-08, M4b-1 / E-Q3 ("cards" includes DON!!).
 */
import { describe, expect, it } from 'vitest';
import {
  activateCounter,
  at,
  attack,
  BLUE,
  canCounterNow,
  choices,
  describeLook,
  don,
  kind,
  LD,
  mine,
  need,
  no,
  none,
  offeredIds,
  passBlock,
  passCounter,
  pickCards,
  pickInst,
  playCard,
  restCost,
  SCN,
  theirs,
  trash,
  unusable,
  yes,
  n,
  atMain,
  RED,
  side,
  theirTurn,
} from './kit-op17b.ts';

const EVENT = 'OP17-037';

describeLook({
  id: EVENT,
  n: 5,
  start: (cards) => {
    const g = mine(LD.neutral, { hand: [EVENT], deck: cards });
    playCard(g, EVENT);
    return g;
  },
  match: ['OP09-006', 'OP09-016'],
  substr: 'OP17-026',
  miss: BLUE,
});

/** p2 attacks p1's Leader; p1 holds the Event. */
function counterStep(spec: Parameters<typeof theirs>[1] = {}) {
  const g = theirs(LD.rhp, { hand: [EVENT], costArea: { active: 3, rested: 0 }, ...spec }, {});
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  return g;
}

describe('OP17-037 [Counter] rest 1 of your cards: +3000', () => {
  it('rest a DON!! as the cost: the Leader gets +3000 for the battle only', () => {
    const g = counterStep();
    activateCounter(g, g.find('p1', 'hand', EVENT));
    yes(g);
    restCost(g, [], 1);
    need(g, 'choose');
    pickInst(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    expect(don(g)).toMatchObject({ active: 1, rested: 2 });
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the cost may rest a Character instead, and the boost may go to a Character', () => {
    const g = counterStep({ characters: [SCN.c2, SCN.c3] });
    activateCounter(g, g.find('p1', 'hand', EVENT));
    yes(g);
    const c2 = at(g, 'p1', 'characters', SCN.c2);
    restCost(g, [c2]);
    expect(g.card(c2).rested).toBe(true);
    pickCards(g, [SCN.c3]);
    expect(g.power(at(g, 'p1', 'characters', SCN.c3))).toBe(8000);
    expect(don(g)).toMatchObject({ active: 2, rested: 1 });
  });

  it("the cost offers my Leader, Characters and DON!! but not the opponent's cards", () => {
    const g = counterStep({ characters: [SCN.c2] });
    activateCounter(g, g.find('p1', 'hand', EVENT));
    yes(g);
    need(g, 'choose');
    expect(choices(g)).toContain(g.leader('p1'));
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(offeredIds(g)).toContain(SCN.c2);
  });

  it('declining the cost: nothing rested, no boost, and the Event is still spent', () => {
    const g = counterStep();
    activateCounter(g, g.find('p1', 'hand', EVENT));
    no(g);
    expect(don(g)).toMatchObject({ active: 2, rested: 1 });
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(trash(g)).toEqual([EVENT]);
  });

  it('CR 8-3-1-3: a rested Leader, no other card and no DON!! left after the Event\'s cost: the "may" cost cannot be paid', () => {
    const g = theirTurn(
      side(LD.rhp, BLUE, {
        leader: { card: LD.rhp, rested: true },
        hand: [EVENT],
        costArea: { active: 1, rested: 0 },
      }),
      side(LD.luffy, RED, { costArea: { active: 10, rested: 0 } }),
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    activateCounter(g, g.find('p1', 'hand', EVENT));
    unusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(don(g)).toMatchObject({ active: 0, rested: 1 });
  });

  it('"up to 1" target: after paying, choosing no target is allowed', () => {
    const g = counterStep();
    activateCounter(g, g.find('p1', 'hand', EVENT));
    yes(g);
    restCost(g, [], 1);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("only my Leader or Characters can be boosted, not the opponent's", () => {
    const g = counterStep();
    activateCounter(g, g.find('p1', 'hand', EVENT));
    yes(g);
    restCost(g, [], 1);
    expect(choices(g)).not.toContain(g.leader('p2'));
  });

  it('a Counter-Step Event: it is not offered in my own Main Phase as a [Main]', () => {
    const g = mine(LD.rhp, { hand: [EVENT] });
    expect(canCounterNow(g, g.find('p1', 'hand', EVENT))).toBe(false);
    expect(kind(g)).toBe('main');
    expect(n(g, 'p1', 'hand')).toBe(1);
    expect(atMain(g)).toBe(true);
  });
});
