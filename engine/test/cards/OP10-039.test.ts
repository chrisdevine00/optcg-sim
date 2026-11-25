/** OP10-039 Gum-Gum Dragon Fire Pistol Twister Star. */
import { describe, expect, it } from 'vitest';
import { dec, expectDecision, hand, none, pick, play, trash, V } from './helpers.ts';
import {
  canPick,
  cardsOf,
  ODY,
  ODYSSEY_LEADER,
  SN_LEADER,
  settle,
  start,
  trigGame,
} from './helpers-a10g4.ts';

const ID = 'OP10-039';
const ODY_B = 'OP09-038'; // the same card twice is fine: two {ODYSSEY} Characters
// Top 5: ODY, V.c1, ODY, V.c2, EVENT (a non-Character card); then V.c3 (not looked at).
const DECK = [ODY, V.c1, ODY_B, V.c2, V.c4, V.c3];

const run = (leader = ODYSSEY_LEADER, deck = DECK) => {
  const g = start({ leader, hand: [ID], deck });
  play(g, ID);
  return g;
};

describe('OP10-039 Gum-Gum Dragon Fire Pistol Twister Star', () => {
  it('[Main]: with an {ODYSSEY} Leader, look at 5, add up to 2 {ODYSSEY} Characters, the rest to the bottom', () => {
    const g = run();
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(2);
    pick(g, [g.find('p1', 'deck', ODY, 0), g.find('p1', 'deck', ODY, 1)]);
    settle(g);
    expect(hand(g, 'p1')).toEqual([ODY, ODY_B]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(4);
    expect(cardsOf(g, 'p1', 'deck')[0]).toBe(V.c3); // the unlooked card stays on top
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('"up to 2": may take one or none; only {ODYSSEY} Characters are offered', () => {
    const g = run(ODYSSEY_LEADER, [ODY, V.c1, V.c2, V.c4, V.c5, V.c3]);
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    expect(canPick(g, g.find('p1', 'deck', V.c1))).toBe(false);
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
    expect(cardsOf(g, 'p1', 'deck')).toHaveLength(6);
  });

  it('must not look at the deck when the Leader does not have the {ODYSSEY} type', () => {
    const g = run(SN_LEADER);
    expect(dec(g)?.kind).toBe('main');
    expect(cardsOf(g, 'p1', 'deck')).toEqual(DECK);
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('with no {ODYSSEY} Character among the 5 the choice is asked at max 0 (nothing leaks)', () => {
    const g = run(ODYSSEY_LEADER, [V.c1, V.c2, V.c4, V.c5, V.c6, V.c3]);
    expect(dec(g)).toMatchObject({ kind: 'choose', max: 0 });
    none(g);
    settle(g);
    expect(hand(g, 'p1')).toEqual([]);
  });

  it("[Trigger]: rest up to 1 of your opponent's Characters with a cost of 5 or less", () => {
    const g = trigGame(ID, {}, [V.c5, V.c6]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c6))).toBe(false); // cost 6
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(g.zone('p2', 'characters').find((c) => c.card === V.c5)!.rested).toBe(true);
    expect(g.zone('p2', 'characters').find((c) => c.card === V.c6)!.rested).toBe(false);
  });
});
