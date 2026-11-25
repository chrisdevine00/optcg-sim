/**
 * OP10-100 Inazuma (Character, Yellow, cost 4, 5000, Counter +1000, {Revolutionary Army}).
 *
 * Card text: "[DON!! x1] [When Attacking] Rest up to 1 of your opponent's Characters with a cost equal
 * to or less than the total of your and your opponent's Life cards. [Trigger] If your Leader has
 * the "Revolutionary Army" type and you and your opponent have a total of 5 or less Life cards,
 * play this card."
 *
 * Rules: [DON!! x1] needs a DON!! given; the cost limit is the sum of both players' Life counts
 * (public); "up to 1"; a [Trigger] is a choice of the damaged player (CR 10-2-4).
 */
import { describe, expect, it } from 'vitest';
import {
  activateTrigger,
  at,
  attack,
  BLUE,
  chr,
  declineTrigger,
  fill,
  hitLeader,
  LD10,
  mine,
  need,
  none,
  offeredIds,
  pickInst,
  RED,
  SC10,
  SC14,
  theirs,
  zoneIds,
  kind,
  hand,
} from './kit-op10c.ts';

const ID = 'OP10-100';

function game(
  p1Life: number,
  p2Life: number,
  don = 1,
  p2: string[] = [SC14.c2, SC14.c4, SC14.c5, SC14.c6],
) {
  return mine(
    LD10.plain,
    {
      characters: [{ card: ID, don }],
      costArea: { active: 3, rested: 0 },
      life: fill(BLUE, p1Life),
    },
    { characters: p2, life: fill(RED, p2Life) },
  );
}

function swing(g: ReturnType<typeof game>) {
  attack(g, at(g, 'p1', 'characters', ID), g.leader('p2'));
}

describe('OP10-100 Inazuma [DON!! x1][When Attacking] rest cost <= total Life; [Trigger] play', () => {
  it('with total Life 5 (2 + 3): offers Characters of cost 5 or less and rests the chosen one', () => {
    const g = game(2, 3);
    swing(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC14.c2, SC14.c4, SC14.c5].sort());
    pickInst(g, [chr(g, 'p2', SC14.c5)]);
    expect(g.card(chr(g, 'p2', SC14.c5)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', SC14.c4)).rested).toBe(false);
  });

  it('boundary: total Life 4 (2 + 2) excludes cost 5, includes cost 4', () => {
    const g = game(2, 2);
    swing(g);
    expect(offeredIds(g)).toEqual([SC14.c2, SC14.c4].sort());
  });

  it("both players' Life counts: 1 + 1 = 2 offers only the cost-2 Character", () => {
    const g = game(1, 1);
    swing(g);
    expect(offeredIds(g)).toEqual([SC14.c2]);
  });

  it('with a large total (4 + 4 = 8) every Character of cost 6 is eligible', () => {
    const g = game(4, 4);
    swing(g);
    expect(offeredIds(g)).toContain(SC14.c6);
  });

  it('"up to 1": may rest nothing', () => {
    const g = game(2, 3);
    swing(g);
    none(g);
    expect(zoneIds(g, 'p2', 'characters')).toHaveLength(4);
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('without a DON!! given the [When Attacking] does not fire', () => {
    const g = game(2, 3, 0);
    swing(g);
    expect(kind(g)).toBe('block');
    expect(g.zone('p2', 'characters').every((c) => !c.rested)).toBe(true);
  });

  it('rests only 1 Character per attack', () => {
    const g = game(4, 4);
    swing(g);
    pickInst(g, [chr(g, 'p2', SC14.c2)]);
    expect(g.zone('p2', 'characters').filter((c) => c.rested)).toHaveLength(1);
  });

  it('[Trigger] with a {Revolutionary Army} Leader and a low Life total: plays this card', () => {
    const g = theirs(LD10.ra, { life: [ID, BLUE] }, { life: fill(RED, 2) });
    hitLeader(g);
    need(g, 'trigger', 'p1');
    activateTrigger(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([ID]);
    expect(hand(g)).toEqual([]);
  });

  it('[Trigger] with a Leader that is not {Revolutionary Army}: the card is not played', () => {
    const g = theirs(LD10.plain, { life: [ID, BLUE] }, { life: fill(RED, 2) });
    hitLeader(g);
    activateTrigger(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Trigger] with a high Life total (p1 4 + p2 4, 7 or 8 after the hit): the card is not played', () => {
    const g = theirs(LD10.ra, { life: [ID, BLUE, BLUE, BLUE] }, { life: fill(RED, 4) });
    hitLeader(g);
    activateTrigger(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('[Trigger] declined: the card goes to hand and is not played', () => {
    const g = theirs(LD10.ra, { life: [ID, BLUE] }, { life: fill(RED, 2) });
    hitLeader(g);
    declineTrigger(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([ID]);
    void SC10;
  });
});
