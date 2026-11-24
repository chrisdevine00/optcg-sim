/**
 * OP14-043 Aladine (Character, Blue, cost 4, 5000, Counter +1000, {The Sun Pirates}/{Merfolk}).
 *
 * Card text: "[On Play] Play up to 1 {Fish-Man} or {Merfolk} type Character card with a cost of 3 or
 * less from your hand.
 * [On K.O.] Draw 1 card."
 *
 * Rules: CR 10-2-1 (K.O.: by a lost battle or by an effect), CR 4-8-1 ("up to"), CR 2-4-3 (exact type),
 * CR 2-7-2 (an effect play costs no DON!!).
 */
import { describe, expect, it } from 'vitest';
import { act, attack } from '../../helpers.ts';
import {
  atMain,
  BLUE,
  C14,
  canFinish,
  chars,
  choices,
  deck,
  don,
  hand,
  inst,
  kind,
  L14,
  mine,
  need,
  noDefence,
  offeredIds,
  opponentKOs,
  pickCards,
  put,
  reachablePickSets,
  rested,
  S14,
  theirs,
  trash,
} from './kit-op14b.ts';

const ALA = 'OP14-043';

function start(extra: string[], p1chars: string[] = []) {
  return mine(L14.luffy, {
    hand: [ALA, ...extra],
    characters: p1chars,
    deck: [C14.kingdew, BLUE, BLUE],
  });
}

describe('OP14-043 Aladine: [On Play] play a {Fish-Man}/{Merfolk} Character of cost 3 or less from hand; [On K.O.] draw 1', () => {
  it('[On Play] plays a {Fish-Man} Character of cost 3 from hand without paying its cost', () => {
    const g = start([C14.namule]);
    put(g, ALA);
    need(g, 'choose', 'p1');
    pickCards(g, [C14.namule]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ALA, C14.namule].sort());
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: 6, rested: 4 });
  });

  it('[On Play] offers {Merfolk} Characters of cost 1 and 3 and a {Fish-Man} of cost 3, and nothing else', () => {
    const g = start([C14.camie, C14.praline, C14.namule, C14.jinbe4, C14.ryuboshi, C14.marco]);
    put(g, ALA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.camie, C14.namule, C14.praline].sort());
  });

  it('boundary: a {Fish-Man} of cost 4 (Jinbe) and a {Merfolk} of cost 5 (Ryuboshi) are not offered', () => {
    const g = start([C14.jinbe4, C14.ryuboshi]);
    put(g, ALA);
    // The pick must be asked even though no card qualifies: a prompt may not depend on hidden cards.
    need(g, 'choose', 'p1');
    expect(choices(g)).toHaveLength(0);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(hand(g)).toEqual([C14.jinbe4, C14.ryuboshi].sort());
  });

  it('a Character of another type (Marco) is not offered', () => {
    const g = start([C14.marco, C14.praline]);
    put(g, ALA);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([C14.praline]);
  });

  it('"up to 1": may play nothing and the hand is untouched', () => {
    const g = start([C14.namule]);
    put(g, ALA);
    need(g, 'choose', 'p1');
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    expect(hand(g)).toEqual([C14.namule]);
    expect(chars(g)).toEqual([ALA]);
  });

  it('plays at most one Character', () => {
    const g = start([C14.namule, C14.camie]);
    put(g, ALA);
    need(g, 'choose', 'p1');
    for (const s of reachablePickSets(g)) {
      expect(s.split('+').filter(Boolean).length).toBeLessThanOrEqual(1);
    }
  });

  it('with no Character in hand the effect ends: nothing is played and the Main Phase resumes', () => {
    const g = start([]);
    put(g, ALA);
    if (kind(g) === 'choose') {
      expect(choices(g)).toHaveLength(0);
      act(g, { type: 'done' });
    }
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([ALA]);
  });

  it('[On Play] does not draw', () => {
    const g = start([C14.namule]);
    put(g, ALA);
    need(g, 'choose', 'p1');
    act(g, { type: 'done' });
    expect(deck(g)).toHaveLength(3);
  });

  it("[On K.O.] K.O.'d by an opposing effect (Gum-Gum Lightning): draws 1", () => {
    const g = theirs(
      L14.luffy,
      { characters: [ALA], deck: [C14.kingdew, BLUE, BLUE] },
      { hand: [S14.lightning] },
    );
    opponentKOs(g, inst(g, 'p1', 'characters', ALA));
    expect(trash(g)).toEqual([ALA]);
    expect(hand(g)).toEqual([C14.kingdew]);
  });

  it("[On K.O.] K.O.'d in battle: draws 1", () => {
    const g = theirs(
      L14.luffy,
      { characters: [{ card: ALA, rested: true }], deck: [C14.kingdew, BLUE, BLUE] },
      {},
    );
    attack(g, g.leader('p2'), inst(g, 'p1', 'characters', ALA));
    noDefence(g);
    expect(trash(g)).toEqual([ALA]);
    expect(hand(g)).toEqual([C14.kingdew]);
    expect(rested(g, g.leader('p2'))).toBe(true);
  });
});
