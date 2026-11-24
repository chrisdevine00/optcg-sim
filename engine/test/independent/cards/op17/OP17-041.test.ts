/**
 * OP17-041 Wang Zhi (Character, Blue, cost 4, 6000, no Counter, {Rocks Pirates}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] You may trash 1 card from your hand: Place all of your opponent's
 * Characters with a base cost of 1 at the bottom of the owner's deck in any order of the owner's
 * choosing"
 *
 * Rules: CR 4-9-2 ("base" cost ignores modifiers), CR 10-1-4 ([Blocker]), CR 8-3-1-3 (cost), CR 3-1-7
 * (the owner orders cards entering an area), RL-15 (bottom-deck is not K.O.), CR 8-1-2 ("may").
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  atMain,
  attack,
  blockers,
  BLUE,
  cardIds,
  deck,
  fill,
  hand,
  kind,
  LD,
  mine,
  n,
  no,
  payHand,
  playCard,
  SCN,
  theirs,
  trash,
  unusable,
  yes,
  decision,
} from './kit-op17b.ts';

const WZ = 'OP17-041';
const FEED = 'OP17-097'; // Black Event cost 1: [Main] give all of the opponent's Characters -1 cost this turn

/** WZ and one other card in hand; the opponent has `opp`. */
function begin(opp: (string | { card: string; rested: boolean })[], extra: string[] = [SCN.c5]) {
  const g = mine(LD.rocks, { hand: [WZ, ...extra] }, { characters: opp });
  playCard(g, WZ);
  return g;
}

/** Pay the cost and settle any order decision the OPPONENT owes, returning the game at Main. */
function use(g: ReturnType<typeof begin>, trashCard = SCN.c5) {
  yes(g);
  payHand(g, [trashCard]);
  if (kind(g) === 'order') {
    expect(decision(g)?.player).toBe('p2');
    g.act(g.legal().find((a) => a.type === 'order')!);
  }
  expect(atMain(g)).toBe(true);
}

describe('OP17-041 Wang Zhi: [Blocker]; [On Play] trash 1: opposing base-cost-1 Characters to the bottom of their deck', () => {
  it('has [Blocker] and can block an attack on my Leader', () => {
    const g = theirs(LD.rocks, { characters: [WZ] }, { characters: [SCN.c3] });
    expect(g.card(at(g, 'p1', 'characters', WZ)).keywords).toContain('Blocker');
    attack(g, g.find('p2', 'characters', SCN.c3), g.leader('p1'));
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', WZ)]);
  });

  it("trashing 1 card places the opposing cost-1 Character at the bottom of its owner's deck", () => {
    const g = begin([SCN.c1]);
    const before = deck(g, 'p2');
    use(g);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(deck(g, 'p2')).toHaveLength(before.length + 1);
    expect(deck(g, 'p2').at(-1)).toBe(SCN.c1);
    expect(trash(g, 'p2')).toEqual([]);
    expect(hand(g, 'p2')).toEqual([]);
    expect(trash(g)).toEqual([SCN.c5]);
  });

  it('"all": every opposing base-cost-1 Character goes, rested or active, and the owner (p2) orders them', () => {
    const g = begin([SCN.c1, { card: SCN.c1, rested: true }, 'OP01-010']);
    yes(g);
    payHand(g, [SCN.c5]);
    if (kind(g) === 'order') expect(decision(g)?.player).toBe('p2');
    while (kind(g) === 'order') g.act(g.legal().find((a) => a.type === 'order')!);
    expect(g.zone('p2', 'characters')).toHaveLength(0);
    expect(deck(g, 'p2').slice(-3).sort()).toEqual([SCN.c1, SCN.c1, 'OP01-010'].sort());
  });

  it('Characters whose base cost is not 1 stay (cost 2 and cost 3)', () => {
    const g = begin([SCN.c1, SCN.c2, SCN.c3]);
    use(g);
    expect(cardIds(g, 'p2', 'characters').sort()).toEqual([SCN.c2, SCN.c3].sort());
  });

  it('my own base-cost-1 Characters are not affected', () => {
    const g = mine(
      LD.rocks,
      { hand: [WZ, SCN.c5], characters: [SCN.c1] },
      { characters: [SCN.c1] },
    );
    playCard(g, WZ);
    use(g);
    expect(cardIds(g, 'p1', 'characters').sort()).toEqual([SCN.c1, WZ].sort());
    expect(g.zone('p2', 'characters')).toHaveLength(0);
  });

  it('"base" cost: a cost-2 Character reduced to cost 1 stays, a base-1 Character reduced to 0 still goes', () => {
    const g = mine(LD.rocks, { hand: [FEED, WZ, SCN.c5] }, { characters: [SCN.c2, SCN.c1] });
    // Black Event: all opposing Characters -1 cost this turn.
    act(g, { type: 'playCard', card: g.find('p1', 'hand', FEED) });
    expect(atMain(g)).toBe(true);
    expect(g.card(at(g, 'p2', 'characters', SCN.c2)).cost).toBe(1);
    expect(g.card(at(g, 'p2', 'characters', SCN.c1)).cost).toBe(0);
    playCard(g, WZ);
    use(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c2]);
  });

  it('declining the cost: nothing is trashed and nothing is moved', () => {
    const g = begin([SCN.c1]);
    no(g);
    expect(atMain(g)).toBe(true);
    expect(hand(g)).toEqual([SCN.c5]);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('CR 8-3-1-3: with no card left in hand the cost cannot be paid and nothing is moved', () => {
    const g = begin([SCN.c1], []);
    unusable(g, 'p1');
    expect(atMain(g)).toBe(true);
    expect(g.zone('p2', 'characters')).toHaveLength(1);
  });

  it('with no opposing cost-1 Character the cost may still be paid and nothing else happens', () => {
    const g = begin([SCN.c4]);
    use(g);
    expect(cardIds(g, 'p2', 'characters')).toEqual([SCN.c4]);
    expect(trash(g)).toEqual([SCN.c5]);
    expect(n(g, 'p2', 'deck')).toBe(15);
  });

  it("must not happen: the Characters are placed, not K.O.'d or trashed (no trash, no [On K.O.])", () => {
    const g = begin([SCN.c1]);
    use(g);
    expect(g.eventsOfType('KO')).toHaveLength(0);
    expect(trash(g, 'p2')).toEqual([]);
    void BLUE;
    void fill;
  });
});
