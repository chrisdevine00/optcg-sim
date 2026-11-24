/** OP11-060 Let's Crash This Wedding!!! */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import {
  canPick,
  cardsOf,
  finishOrder,
  mk,
  RED_LEADER,
  SHC1,
  SHC4,
  VINSMOKE_LEADER,
} from './helpers-op11g2.ts';

const ID = 'OP11-060';
// Top 5: a {Straw Hat Crew} card, a non-{Straw Hat Crew} card, another copy of this Event, a second {Straw Hat Crew}, a vanilla; 6th: {Straw Hat Crew}.
const top5 = [SHC1, V.c2, ID, SHC4, V.c3];
const deck = [...top5, SHC1, ...times(4, BLUE)];

describe("OP11-060 Let's Crash This Wedding!!!", () => {
  it('[Main] with a multicolored Leader: looks at 5; a {Straw Hat Crew} card other than this Event can be taken, the rest go to the bottom', () => {
    const g = mk({ leader: VINSMOKE_LEADER, hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', SHC1))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', SHC4))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', ID))).toBe(false); // another [Let's Crash This Wedding!!!]
    expect(canPick(g, g.find('p1', 'deck', V.c2))).toBe(false);
    pick(g, [g.find('p1', 'deck', SHC4)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SHC4]);
    const d = cardsOf(g, 'p1', 'deck');
    expect(d).toHaveLength(9);
    expect(d[0]).toBe(SHC1); // the 6th card was not looked at
    expect(d.slice(-4).sort()).toEqual([SHC1, V.c2, ID, V.c3].sort());
  });

  it('the 6th card is not looked at, and "up to 1" may take nothing', () => {
    const g = mk({
      leader: VINSMOKE_LEADER,
      hand: [ID],
      deck: [V.c1, V.c2, V.c3, V.c4, V.c5, SHC1, ...times(4, BLUE)],
    });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(SHC1);
  });

  it('must not fire with a Leader that is not multicolored: nothing is looked at and the deck is unchanged', () => {
    const g = mk({ leader: RED_LEADER, hand: [ID], deck });
    play(g, ID);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p1', 'deck')).toEqual(deck);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it('[Trigger]: activates the [Main] effect', () => {
    const g = mk(
      { leader: VINSMOKE_LEADER, life: [ID, V.c1, V.c1], deck },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'deck', SHC1)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([SHC1]);
  });

  it('[Trigger] with a Leader that is not multicolored does nothing', () => {
    const g = mk(
      { leader: RED_LEADER, life: [ID, V.c1, V.c1], deck },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toEqual(deck);
  });
});
