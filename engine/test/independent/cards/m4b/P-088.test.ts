/**
 * P-088 Trafalgar Law (Character, Yellow, cost 4, 5000, Counter +2000; Heart Pirates / Supernovas).
 *
 * Card text: no effect text. "[Trigger] If your Leader has the "Supernovas" type and you and your
 * opponent have a total of 5 or less Life cards, play this card."
 *
 * Rules: CR 10-1-5-3: while its [Trigger] is being activated the card is in no area, so the Life card
 * just taken is NOT counted; the total is checked when the effect resolves (after damage was taken);
 * CR 4-10-1 failed condition. Leaders: OP01-002 Law (Green/Red, Heart Pirates / Supernovas),
 * ST06-001 (Navy only).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  BLUE,
  hitLeader,
  LD,
  LEAD,
  myTurn,
  playFromHand,
  RED,
  rep,
  side,
  sortedIds,
  theirTurn,
} from './kit-d.ts';

const LAW = 'P-088';

function trig(leader: string, myLife: number, theirLife: number) {
  // p1's Life, top first: P-088, then (myLife - 1) others; p2's Life: theirLife cards.
  const g = theirTurn(
    side(leader, BLUE, { life: [LAW, ...rep(BLUE, myLife - 1)] }),
    side(LEAD.luffy, RED, { life: rep(RED, theirLife) }),
  );
  hitLeader(g);
  activateTrigger(g);
  return g;
}

describe('P-088 Trafalgar Law [Trigger]: Supernovas Leader and a combined 5 or less Life: play this card', () => {
  it('boundary 5: after the hit I have 2 Life and the opponent has 3: total 5, so it is played', () => {
    const g = trig(LD.supernova, 3, 3);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LAW]);
    expect(g.life('p1')).toBe(2);
  });

  it('boundary 6: after the hit I have 2 Life and the opponent has 4: total 6, so it is not played', () => {
    const g = trig(LD.supernova, 3, 4);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([LAW]);
  });

  it('the revealed Life card is not counted: 4 Life before the hit and 2 for the opponent is total 5', () => {
    const g = trig(LD.supernova, 4, 2);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LAW]);
  });

  it('a total well under 5 (1 + 0) is played', () => {
    const g = trig(LD.supernova, 2, 0);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LAW]);
  });

  it('the Leader must have the Supernovas type: a Navy Leader with a total of 5 does not play it', () => {
    const g = trig(LD.navy, 3, 3);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([LAW]);
  });
});

describe('P-088 Trafalgar Law as a Character', () => {
  it('it has no [On Play] or other effect: playing it from hand only costs 4 DON!!', () => {
    const g = myTurn(
      side(LD.supernova, BLUE, { hand: [LAW], costArea: { active: 4, rested: 0 } }),
      side(LEAD.luffy, RED),
    );
    playFromHand(g, LAW);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([LAW]);
    expect(g.power(g.find('p1', 'characters', LAW))).toBe(5000);
  });
});
