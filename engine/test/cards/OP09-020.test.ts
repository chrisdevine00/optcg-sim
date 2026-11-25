/** OP09-020 Come On!! We'll Fight You!! (Event, cost 1). */
import { describe, expect, it } from 'vitest';
import {
  BLUE,
  canPick,
  damageGame,
  expectDecision,
  finishOrder,
  hand,
  idsOf,
  mk,
  none,
  OTHER_LEADER,
  pick,
  play,
  RHP4,
  RHP6,
  times,
  trash,
  V,
} from './helpers-a09g4.ts';

const ID = 'OP09-020';
/** Another Red-Haired Pirates Event (OP09-019), and a Red-Haired Pirates Stage-free filler. */
const RHP_EVENT = 'OP09-019';

describe("OP09-020 Come On!! We'll Fight You!!: [Main]", () => {
  // Top 5: this card's name, a Character, a non-RHP card, another RHP Event, a Character; then filler.
  const top5 = [ID, RHP4, V.c1, RHP_EVENT, RHP6];
  const start = (deck = [...top5, ...times(5, BLUE)]) => mk({ hand: [ID], deck });

  it('reveals up to 1 Red-Haired Pirates card from the top 5 into your hand; the rest go to the bottom', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', RHP4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', RHP6))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false); // another type
    pick(g, [g.find('p1', 'deck', RHP6)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([RHP6]);
    const deck = idsOf(g, 'p1', 'deck');
    expect(deck).toHaveLength(9);
    expect(deck.slice(5).sort()).toEqual([ID, RHP4, V.c1, RHP_EVENT].sort());
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it("must not take a card named [Come On!! We'll Fight You!!] (another copy of itself)", () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false);
  });

  it('another Red-Haired Pirates card of any category counts: an Event may be taken', () => {
    const g = start();
    play(g, ID);
    expect(canPick(g, g.find('p1', 'deck', RHP_EVENT))).toBe(true);
    pick(g, [g.find('p1', 'deck', RHP_EVENT)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([RHP_EVENT]);
  });

  it('"up to 1": may take nothing; all 5 go to the bottom', () => {
    const g = start();
    play(g, ID);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck').slice(5).sort()).toEqual([...top5].sort());
  });

  it('boundary: the 6th card is not looked at', () => {
    const g = start([V.c1, V.c1, V.c1, V.c1, V.c1, RHP4, ...times(4, BLUE)]);
    play(g, ID);
    // The choice is still asked (a hidden top must not show "no match"), at max 0.
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().some((a) => a.type === 'pick')).toBe(false);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(idsOf(g, 'p1', 'deck')[0]).toBe(RHP4); // not looked at: still on top
  });
});

describe("OP09-020 Come On!! We'll Fight You!!: [Trigger]", () => {
  it('draws 1 card', () => {
    const g = damageGame(ID, { leader: OTHER_LEADER, deck: [V.c2, V.c3] });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([V.c2]);
  });
});
