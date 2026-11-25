/**
 * OP10-110 Heat & Wire (Character, Yellow, cost 3, 4000, Counter +1000, {Kid Pirates}).
 *
 * Card text: "[On Play] Rest up to 1 of your opponent's Characters with a cost equal to or less
 * than the number of your opponent's Life cards. [Trigger] If you have 2 or less Life cards, play
 * this card."
 *
 * Rules: the limit is the opponent's Life count only (public); "up to 1"; a [Trigger] is the
 * damaged player's choice (CR 10-2-4); a Character played by a [Trigger] still has its [On Play].
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  BLUE,
  chr,
  declineTrigger,
  fill,
  hand,
  hitLeader,
  kind,
  LD10,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  playRaw,
  RED,
  SC14,
  theirs,
  zoneIds,
} from './kit-op10c.ts';

const ID = 'OP10-110';
const P2 = [SC14.c1, SC14.c2, SC14.c3, SC14.c4];

function played(p1Life: number, p2Life: number, p2: string[] = P2) {
  const g = mine(
    LD10.plain,
    { hand: [ID], costArea: { active: 3, rested: 0 }, life: fill(BLUE, p1Life) },
    { characters: p2, life: fill(RED, p2Life) },
  );
  playRaw(g, ID);
  return g;
}

describe("OP10-110 Heat & Wire [On Play] rest cost <= opponent's Life; [Trigger] play with <= 2 Life", () => {
  it('with the opponent at 3 Life, offers Characters of cost 3 or less and rests the chosen one', () => {
    const g = played(4, 3);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c1, SC14.c2, SC14.c3].sort());
    pickInst(g, [chr(g, 'p2', SC14.c3)]);
    expect(g.card(chr(g, 'p2', SC14.c3)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', SC14.c2)).rested).toBe(false);
  });

  it('boundary: with the opponent at 2 Life, cost 2 is offered and cost 3 is not', () => {
    const g = played(4, 2);
    expect(offeredIds(g)).toEqual([SC14.c1, SC14.c2].sort());
  });

  it("only the opponent's Life counts: my 4 Life do not widen the limit when they have 1", () => {
    const g = played(4, 1);
    expect(offeredIds(g)).toEqual([SC14.c1]);
  });

  it('with the opponent at 4 Life a cost-4 Character is a target', () => {
    const g = played(1, 4);
    expect(offeredIds(g)).toContain(SC14.c4);
  });

  it('with the opponent at 0 Life no Character is a target and nothing is rested', () => {
    const g = played(4, 0);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('"up to 1": may rest nothing', () => {
    const g = played(4, 3);
    none(g);
    need(g, 'main', 'p1');
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('rests only 1 Character', () => {
    const g = played(4, 3);
    pickInst(g, [chr(g, 'p2', SC14.c1)]);
    expect(g.zone('p2', 'characters').filter((c) => c.rested)).toHaveLength(1);
  });

  it("[Trigger] with 2 or less Life cards: playing it, then its [On Play] is offered to the opponent's Characters", () => {
    const g = theirs(
      LD10.plain,
      { life: [ID, BLUE] },
      { characters: [SC14.c3], life: fill(RED, 3) },
    );
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([ID]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c3]);
  });

  it('[Trigger] with 4 Life cards: the card is not played', () => {
    const g = theirs(
      LD10.plain,
      { life: [ID, BLUE, BLUE, BLUE] },
      { characters: [SC14.c3], life: fill(RED, 3) },
    );
    hitLeader(g);
    activateTrigger(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Trigger] declined: the card goes to hand', () => {
    const g = theirs(LD10.plain, { life: [ID, BLUE] }, {});
    hitLeader(g);
    declineTrigger(g);
    expect(hand(g)).toEqual([ID]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
  });
});
