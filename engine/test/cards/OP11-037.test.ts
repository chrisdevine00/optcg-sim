/** OP11-037 Ancient Weapon Poseidon. */
import { describe, expect, it } from 'vitest';
import { BLUE, expectDecision, hand, none, pick, play, times, V } from './helpers.ts';
import {
  canPick,
  cardsOf,
  FMI_CHAR,
  FMI_EVENT,
  finishOrder,
  mk,
  NEPT,
  NEPT_EB,
} from './helpers-op11g2.ts';

const ID = 'OP11-037';
// Top 4: a vanilla, a {Neptunian}, a {Fish-Man Island} Event, a {Fish-Man Island} Character; 5th: another {Neptunian}.
const top = [V.c1, NEPT, FMI_EVENT, FMI_CHAR, NEPT_EB];
const start = (deck = [...top, ...times(5, BLUE)]) => {
  const g = mk({ hand: [ID], deck });
  play(g, ID);
  return g;
};

describe('OP11-037 Ancient Weapon Poseidon', () => {
  it('[Main]: looks at 4; only {Neptunian} / {Fish-Man Island} Characters are offered (not the Event, not the 5th card)', () => {
    const g = start();
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'deck', NEPT))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', FMI_CHAR))).toBe(true);
    expect(canPick(g, g.find('p1', 'deck', FMI_EVENT))).toBe(false); // an Event, not a Character
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    expect(canPick(g, g.find('p1', 'deck', NEPT_EB))).toBe(false); // the 5th card is not looked at
    pick(g, [g.find('p1', 'deck', NEPT)]);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([NEPT]);
    expect(g.eventsOfType('CardRevealed').at(-1)!.card).toBe(NEPT);
  });

  it('the other 3 looked-at cards go to the bottom; the 5th card is now on top', () => {
    const g = start();
    pick(g, [g.find('p1', 'deck', FMI_CHAR)]);
    finishOrder(g);
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck).toHaveLength(9);
    expect(deck[0]).toBe(NEPT_EB);
    expect(deck.slice(-3).sort()).toEqual([V.c1, NEPT, FMI_EVENT].sort());
  });

  it('"up to 1": may take nothing; all 4 go to the bottom', () => {
    const g = start();
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    const deck = cardsOf(g, 'p1', 'deck');
    expect(deck[0]).toBe(NEPT_EB);
    expect(deck.slice(-4).sort()).toEqual([V.c1, NEPT, FMI_EVENT, FMI_CHAR].sort());
  });

  it('must not offer a match in the 5th position: with none in the top 4 nothing can be taken', () => {
    const g = start([V.c1, V.c2, V.c3, FMI_EVENT, NEPT, ...times(5, BLUE)]);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    finishOrder(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(NEPT);
  });

  it('[Trigger]: draw 1 card', () => {
    const g = mk(
      { life: [ID, V.c1, V.c1], deck: times(5, BLUE) },
      { characters: [V.c7] },
      { turn: 4, activePlayer: 'p2' },
    );
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    g.act({ type: 'block', blocker: null });
    g.act({ type: 'endCounter' });
    g.act({ type: 'trigger', activate: true });
    expect(hand(g, 'p1')).toEqual([BLUE]);
    expect(g.zone('p1', 'deck')).toHaveLength(4);
  });
});
